from PIL import Image, ImageDraw, ImageFont
import os

def create_social_image(text, output_path, bg_color=(26, 35, 126), text_color=(255, 255, 255), size=(1200, 630)):
    """Create a social sharing image with the given text and styling."""
    # Create a new image with the specified background color
    image = Image.new('RGB', size, color=bg_color)
    draw = ImageDraw.Draw(image)
    
    # Try to use Montserrat font, fall back to default if not available
    try:
        font_size = 48
        font = ImageFont.truetype("Montserrat-Bold.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()
    
    # Calculate text position (centered)
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    x = (size[0] - text_width) / 2
    y = (size[1] - text_height) / 2
    
    # Draw the text
    draw.text((x, y), text, font=font, fill=text_color)
    
    # Add a subtle pattern or gradient (optional)
    # For now, we'll keep it simple with a solid color
    
    # Save the image
    image.save(output_path)
    print(f"Created social image: {output_path}")

def main():
    # Create images directory if it doesn't exist
    os.makedirs("images", exist_ok=True)
    
    # Create main social sharing image
    create_social_image(
        "SoftAIDev - AI-Powered Software Solutions",
        "images/softaidev-social.jpg"
    )
    
    # Create blog preview image
    create_social_image(
        "SoftAIDev Blog - Latest in AI & Development",
        "images/blog-preview.jpg"
    )
    
    # Create services preview image
    create_social_image(
        "Our Services - AI Development & Consulting",
        "images/services-preview.jpg"
    )

if __name__ == "__main__":
    main()
