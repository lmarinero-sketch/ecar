"""
Remove white background from GIF files, making it transparent.
Outputs APNG (animated PNG) which supports full alpha transparency.
"""
from PIL import Image
import os
import sys

THRESHOLD = 240  # Pixels with R,G,B all above this value are considered "white"

def remove_bg_gif_to_apng(input_path, output_path):
    """Process an animated GIF: remove white bg, save as APNG with transparency."""
    gif = Image.open(input_path)
    frames = []
    durations = []
    
    try:
        while True:
            # Convert frame to RGBA
            frame = gif.convert('RGBA')
            data = frame.getdata()
            
            new_data = []
            for pixel in data:
                r, g, b, a = pixel
                # If pixel is near-white, make it transparent
                if r >= THRESHOLD and g >= THRESHOLD and b >= THRESHOLD:
                    new_data.append((r, g, b, 0))
                else:
                    new_data.append(pixel)
            
            frame.putdata(new_data)
            frames.append(frame.copy())
            
            # Get frame duration
            duration = gif.info.get('duration', 100)
            durations.append(duration)
            
            gif.seek(gif.tell() + 1)
    except EOFError:
        pass
    
    if not frames:
        print(f"  ERROR: No frames found in {input_path}")
        return
    
    # Save as APNG
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        disposal=2,  # Clear frame before drawing next
    )
    
    input_size = os.path.getsize(input_path) / 1024 / 1024
    output_size = os.path.getsize(output_path) / 1024 / 1024
    print(f"  ✅ {os.path.basename(input_path)}")
    print(f"     {input_size:.1f}MB -> {output_size:.1f}MB ({len(frames)} frames)")

def main():
    public_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')
    
    gif_files = [
        'Rombo_ahora_esta_caminando_de_costado.gif',
        'Rombo_is_greeting_with_too_much_joy.gif',
    ]
    
    print("🎨 Removing white backgrounds from GIFs -> APNG\n")
    
    for gif_name in gif_files:
        gif_path = os.path.join(public_dir, gif_name)
        if not os.path.exists(gif_path):
            print(f"  ⚠️ Not found: {gif_name}")
            continue
        
        # Output as .png (APNG format)
        apng_name = os.path.splitext(gif_name)[0] + '.png'
        apng_path = os.path.join(public_dir, apng_name)
        
        print(f"  Processing: {gif_name}")
        remove_bg_gif_to_apng(gif_path, apng_path)
    
    print("\n✅ Done! Update your code to use .png instead of .gif")

if __name__ == '__main__':
    main()
