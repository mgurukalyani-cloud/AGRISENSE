"""
Audio Feature Extraction Module for AgriSense
Computes genuine bio-acoustic audio features using NumPy and SciPy:
- Mel Filterbanks & Mel Spectrogram
- Mel-Frequency Cepstral Coefficients (MFCCs)
- Spectral Centroid, Bandwidth, and Rolloff
- Zero-Crossing Rate (ZCR)
- Root Mean Square (RMS) Energy & Temporal Dynamics
- Dominant Frequencies & Harmonics
"""

import numpy as np
from scipy import signal
from scipy.fftpack import dct
from typing import Dict, Any, Tuple


def hz_to_mel(hz: np.ndarray) -> np.ndarray:
    """Convert Hz to Mel scale."""
    return 2595.0 * np.log10(1.0 + hz / 700.0)


def mel_to_hz(mel: np.ndarray) -> np.ndarray:
    """Convert Mel scale to Hz."""
    return 700.0 * (10.0 ** (mel / 2595.0) - 1.0)


def create_mel_filterbank(num_filters: int = 40, nfft: int = 1024, sample_rate: int = 16000,
                          low_freq: float = 50.0, high_freq: float = 7500.0) -> np.ndarray:
    """
    Construct triangular Mel-scale filterbanks.
    """
    if high_freq > sample_rate / 2.0:
        high_freq = sample_rate / 2.0

    low_mel = hz_to_mel(np.array([low_freq]))[0]
    high_mel = hz_to_mel(np.array([high_freq]))[0]
    mel_points = np.linspace(low_mel, high_mel, num_filters + 2)
    hz_points = mel_to_hz(mel_points)
    bin_points = np.floor((nfft + 1) * hz_points / sample_rate).astype(int)

    filterbank = np.zeros((num_filters, int(nfft / 2 + 1)))
    for i in range(1, num_filters + 1):
        left = bin_points[i - 1]
        center = bin_points[i]
        right = bin_points[i + 1]

        if center > left:
            filterbank[i - 1, left:center] = (np.arange(left, center) - left) / (center - left)
        if right > center:
            filterbank[i - 1, center:right] = (right - np.arange(center, right)) / (right - center)

    return filterbank


def compute_stft(y: np.ndarray, nfft: int = 1024, hop_length: int = 256,
                 sample_rate: int = 16000) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Compute Short-Time Fourier Transform power spectrum.
    """
    window = signal.windows.hann(nfft)
    freqs, times, Zxx = signal.stft(
        y, fs=sample_rate, window=window, nperseg=nfft, noverlap=nfft - hop_length, boundary=None
    )
    power_spectrum = np.abs(Zxx) ** 2
    return freqs, times, power_spectrum


def extract_acoustic_features(y: np.ndarray, sample_rate: int = 16000, num_mfcc: int = 20,
                              num_mel: int = 40) -> Dict[str, Any]:
    """
    Extract comprehensive acoustic and spectral pattern features from an audio buffer.
    y: 1D float32 numpy array normalized to [-1, 1].
    """
    if len(y) == 0:
        raise ValueError("Audio buffer is empty.")

    # Convert to mono if multi-channel
    if y.ndim > 1:
        y = np.mean(y, axis=1)

    # Ensure float32 normalized
    y = y.astype(np.float32)
    max_val = np.max(np.abs(y))
    if max_val > 0:
        y = y / max_val

    duration_sec = len(y) / float(sample_rate)

    # 1. Pre-emphasis filter to boost higher frequencies for speech/animal harmonics
    y_pre = np.append(y[0], y[1:] - 0.97 * y[:-1])

    # 2. STFT and Power Spectrum
    nfft = 1024
    hop_length = 256
    freqs, times, power_spec = compute_stft(y_pre, nfft=nfft, hop_length=hop_length, sample_rate=sample_rate)
    mag_spec = np.sqrt(power_spec + 1e-10)

    # 3. Mel-Filterbank Energies
    fb = create_mel_filterbank(num_filters=num_mel, nfft=nfft, sample_rate=sample_rate)
    mel_energies = np.dot(fb, power_spec + 1e-10)  # Shape: (num_mel, num_frames)
    log_mel = np.log10(mel_energies + 1e-10)

    # 4. MFCCs via DCT
    mfcc = dct(log_mel, type=2, axis=0, norm='ortho')[:num_mfcc, :]

    # 5. Spectral Centroid
    spectral_sum = np.sum(mag_spec, axis=0) + 1e-10
    spectral_centroids = np.sum(freqs[:, np.newaxis] * mag_spec, axis=0) / spectral_sum

    # 6. Spectral Spread (Bandwidth)
    variance = np.sum(((freqs[:, np.newaxis] - spectral_centroids) ** 2) * mag_spec, axis=0) / spectral_sum
    spectral_bandwidth = np.sqrt(np.maximum(0, variance))

    # 7. Spectral Rolloff (85% energy frequency)
    cumulative_power = np.cumsum(power_spec, axis=0)
    total_power = cumulative_power[-1, :] + 1e-10
    threshold = 0.85 * total_power
    rolloff_bins = np.argmax(cumulative_power >= threshold[np.newaxis, :], axis=0)
    spectral_rolloff = freqs[rolloff_bins]

    # 8. Zero-Crossing Rate (ZCR)
    # Frame-wise ZCR
    frame_len = nfft
    hop_len = hop_length
    num_frames = max(1, (len(y) - frame_len) // hop_len + 1)
    zcr_series = []
    for i in range(num_frames):
        start = i * hop_len
        end = min(len(y), start + frame_len)
        frame = y[start:end]
        if len(frame) > 1:
            zcr = 0.5 * np.mean(np.abs(np.diff(np.sign(frame))))
            zcr_series.append(zcr)
        else:
            zcr_series.append(0.0)
    zcr_series = np.array(zcr_series)

    # 9. RMS Energy
    frame_rms = []
    for i in range(num_frames):
        start = i * hop_len
        end = min(len(y), start + frame_len)
        frame = y[start:end]
        if len(frame) > 0:
            rms = np.sqrt(np.mean(frame ** 2))
            frame_rms.append(rms)
        else:
            frame_rms.append(0.0)
    frame_rms = np.array(frame_rms)

    # 10. Dominant frequency estimation
    mean_power_profile = np.mean(power_spec, axis=1)
    dom_bin = np.argmax(mean_power_profile)
    dominant_frequency_hz = float(freqs[dom_bin])

    # 11. Compile Statistical Feature Vector (131 dimensional)
    # - 20 MFCC means + 20 MFCC stds (40)
    # - 40 Mel filterbank means + 40 Mel filterbank stds (80)
    # - Spectral Centroid mean + std (2)
    # - Spectral Bandwidth mean + std (2)
    # - Spectral Rolloff mean + std (2)
    # - ZCR mean + std (2)
    # - RMS Energy mean, max, std (3)
    # Total: 40 + 80 + 2 + 2 + 2 + 2 + 3 = 131 features
    feature_vector = np.concatenate([
        np.mean(mfcc, axis=1),
        np.std(mfcc, axis=1),
        np.mean(log_mel, axis=1),
        np.std(log_mel, axis=1),
        [np.mean(spectral_centroids), np.std(spectral_centroids)],
        [np.mean(spectral_bandwidth), np.std(spectral_bandwidth)],
        [np.mean(spectral_rolloff), np.std(spectral_rolloff)],
        [np.mean(zcr_series), np.std(zcr_series)],
        [np.mean(frame_rms), np.max(frame_rms), np.std(frame_rms)]
    ]).astype(np.float32)

    return {
        "feature_vector": feature_vector,
        "metrics": {
            "duration_sec": round(float(duration_sec), 2),
            "dominant_frequency_hz": round(dominant_frequency_hz, 1),
            "spectral_centroid_hz": round(float(np.mean(spectral_centroids)), 1),
            "spectral_bandwidth_hz": round(float(np.mean(spectral_bandwidth)), 1),
            "spectral_rolloff_hz": round(float(np.mean(spectral_rolloff)), 1),
            "zero_crossing_rate": round(float(np.mean(zcr_series)), 4),
            "rms_energy": round(float(np.mean(frame_rms)), 4),
            "peak_rms": round(float(np.max(frame_rms)), 4),
            "snr_estimate_db": round(float(10.0 * np.log10((np.max(frame_rms) + 1e-6) / (np.mean(frame_rms) * 0.1 + 1e-6))), 1)
        },
        "mel_spectrogram_preview": log_mel[:, :min(log_mel.shape[1], 32)].tolist()
    }
