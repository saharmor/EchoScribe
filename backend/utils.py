import os
from pydub import AudioSegment


def load_audio(input_path):
    # Get file extension
    file_ext = os.path.splitext(input_path)[1].lower()
    
    # Load audio file based on extension
    if file_ext == '.wav':
        audio = AudioSegment.from_wav(input_path)
    elif file_ext == '.mp3':
        audio = AudioSegment.from_mp3(input_path)
    elif file_ext == '.m4a':
        audio = AudioSegment.from_file(input_path, format='m4a')
    elif file_ext == '.ogg':
        audio = AudioSegment.from_file(input_path, format='ogg')
    elif file_ext == '.webm':
        audio = AudioSegment.from_file(input_path, format='webm')
    else:
        raise ValueError(f"Unsupported file format: {file_ext}")
    return audio

def compress_audio(audio):
    # Moderate compression - keeping stereo and good sample rate
    return audio.set_frame_rate(32000)  # Still good for speech recognition

def convert_to_mp3(input_path, output_path=None, bitrate="128k"):
    # Load and compress the audio
    audio = load_audio(input_path)
    audio = compress_audio(audio)
    
    # Generate output path if not provided
    if output_path is None:
        output_path = os.path.splitext(input_path)[0] + '.mp3'
    
    # Export as MP3 with balanced parameters
    audio.export(
        output_path,
        format='mp3',
        bitrate=bitrate,
        parameters=[
            "-q:a", "4",  # Medium-high VBR quality (0-9, where 0 is best)
            "-ar", "32000"  # Balanced sample rate
        ]
    )
    return output_path
