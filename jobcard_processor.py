#!/usr/bin/env python3
"""
Unified Job Card Processing System
Combines: PDF form filling, Google Drive image extraction, and PDF merging
"""

import os
import re
import sys
import json
import tempfile
from datetime import datetime
from pathlib import Path
import pandas as pd
import fitz  # PyMuPDF
from pdfrw import PdfReader, PdfWriter, PdfDict, PdfObject
from PIL import Image
from io import BytesIO
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# ==================== CONFIGURATION ====================
CONFIG = {
    # File paths
    'template_pdf': '/Users/skhumbuzotshuma/Downloads/combine/NEW JOB CARD 2025 - BRUCE.pdf',
    'spreadsheet': '/Users/skhumbuzotshuma/Downloads/combine/jobcard_data.xlsx',
    
    # Output folders
    'output_base': '/Users/skhumbuzotshuma/Downloads/combine',
    'job_cards_folder': 'job_cards',
    'images_folder': 'images',
    'final_folder': 'final_job_cards',
    
    # Google Drive
    'service_account_file': '/Users/skhumbuzotshuma/Downloads/jobcardcode/credentials.json',
    
    # Installer details
    'installer_name': 'BRUCE MHLANGA',
    'company_name': 'LIGHTUP ENTERPRISE',
    'company_phone': '0798561362',
    'sdc_name': 'RANDBURG'
}

# ==================== UTILITY FUNCTIONS ====================
def ensure_directories():
    """Create all necessary directories"""
    base = CONFIG['output_base']
    dirs = [
        base,
        os.path.join(base, CONFIG['job_cards_folder']),
        os.path.join(base, CONFIG['images_folder']),
        os.path.join(base, CONFIG['final_folder'])
    ]
    for d in dirs:
        os.makedirs(d, exist_ok=True)
        print(f"📁 Ensured directory: {d}")

def clean_account_number(value):
    """Clean and format account number"""
    if pd.isna(value):
        return ""
    return str(value).split('.')[0].strip()

def remove_decimal(value):
    """Remove decimal places from numbers"""
    if pd.isna(value):
        return ""
    str_value = str(value)
    if '.' in str_value:
        int_part, dec_part = str_value.split('.')
        if dec_part == '0' or all(c == '0' for c in dec_part):
            return int_part
        dec_part = dec_part.rstrip('0')
        return f"{int_part}.{dec_part}" if dec_part else int_part
    return str_value

def extract_account_from_filename(filename):
    """Extract account number from filename"""
    patterns = [
        r'(?:JOB_CARD_|IMAGES_|MERGED_)(\d+)',
        r'(\d{9,})',
        r'account[_\s]*(\d+)',
        r'acc[_\s]*(\d+)',
        r'(\d+)\.pdf$'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, filename, re.IGNORECASE)
        if match:
            return match.group(1)
    
    # Fallback: get longest number
    numbers = re.findall(r'\d+', filename)
    return max(numbers, key=len) if numbers else None

# ==================== PDF FORM FILLING ====================
class JobCardFiller:
    """Handles filling of PDF job card forms"""
    
    def __init__(self, template_path):
        self.template_path = template_path
        
    def prepare_data(self, row):
        """Prepare form data from spreadsheet row"""
        data = {}
        
        # Customer details
        if "Customer Name" in row.index:
            data["(Customer name)"] = str(row.get("Customer Name", "")).strip()
        if "Contract Account" in row.index:
            data["(Account number)"] = clean_account_number(row.get("Contract Account", ""))
        if "ID Number" in row.index:
            data["(ID Number)"] = str(row.get("ID Number", "")).strip()
        
        # Address
        address_parts = []
        if "House No" in row.index and pd.notna(row.get("House No")):
            address_parts.append(str(row.get("House No")).strip())
        if "Street" in row.index and pd.notna(row.get("Street")):
            address_parts.append(str(row.get("Street")).strip())
        data["(Address)"] = " ".join(address_parts)
        
        if "Complex" in row.index:
            data["(Complex name)"] = str(row.get("Complex", "")).strip()
        if "City" in row.index:
            data["(Suburb)"] = str(row.get("City", "")).strip()
        
        data["(SDC Name)"] = CONFIG['sdc_name']
        
        # Meter details
        if "Device" in row.index:
            data["(Old Meter NumberRow1)"] = remove_decimal(row.get("Device", ""))
        if "Old Meter Readings" in row.index:
            data["(Meter ReadingRow1)"] = remove_decimal(row.get("Old Meter Readings", ""))
        if "Meter Factor" in row.index:
            data["(Meter FactorRow1)"] = remove_decimal(row.get("Meter Factor", ""))
        if "New Meter Number" in row.index:
            data["(New Meter NumberRow1)"] = remove_decimal(row.get("New Meter Number", ""))
        if "Register" in row.index:
            data["(Regis erRow1)"] = remove_decimal(row.get("Register", ""))
        
        data["(Installation ReadingRow1)"] = "0.0 kWh"
        
        if "Digits" in row.index:
            data["(No of DigitsRow1)"] = remove_decimal(row.get("Digits", ""))
        
        # Comments and status
        if "Status" in row.index:
            data["(Comment)"] = str(row.get("Status", "")).strip()
        if "Comment" in row.index:
            data["(Comment2)"] = str(row.get("Comment", "")).strip()
        
        # Installer details
        data["(Installed by)"] = CONFIG['installer_name']
        data["(Company)"] = CONFIG['company_name']
        data["(Telephone)"] = CONFIG['company_phone']
        data["(Other explain)"] = "POSTPAID"
        
        # Date
        if "Installation Date" in row.index and pd.notna(row.get("Installation Date")):
            try:
                date_val = pd.to_datetime(row.get("Installation Date"), errors='coerce')
                if pd.notna(date_val):
                    data["(Date)"] = date_val.strftime("%d/%m/%Y")
                else:
                    data["(Date)"] = datetime.now().strftime("%d/%m/%Y")
            except:
                data["(Date)"] = datetime.now().strftime("%d/%m/%Y")
        else:
            data["(Date)"] = datetime.now().strftime("%d/%m/%Y")
        
        return data
    
    def fill_pdf(self, output_path, data):
        """Fill PDF form and save"""
        try:
            pdf = PdfReader(self.template_path)
            
            # Enable form fields
            if '/AcroForm' in pdf.Root:
                acroform = pdf.Root.AcroForm
                if isinstance(acroform, PdfDict):
                    acroform.NeedAppearances = PdfObject('true')
            
            # Fill fields
            fields_filled = 0
            if "/Annots" in pdf.pages[0]:
                for annot in pdf.pages[0]["/Annots"]:
                    if annot["/Subtype"] == "/Widget" and annot.get("/T"):
                        field_name = annot["/T"].strip()
                        
                        # Try different field name variations
                        value = None
                        if field_name in data:
                            value = data[field_name]
                        elif field_name.strip("()") in data:
                            value = data[field_name.strip("()")]
                        elif f"({field_name})" in data:
                            value = data[f"({field_name})"]
                        
                        if value:
                            annot.V = str(value)
                            annot.AS = str(value)
                            annot.update(PdfDict(AP=PdfDict()))
                            fields_filled += 1
            
            # Save filled PDF
            PdfWriter().write(output_path, pdf)
            return True, fields_filled
            
        except Exception as e:
            print(f"    ❌ Error filling PDF: {e}")
            return False, 0

# ==================== GOOGLE DRIVE IMAGE EXTRACTOR ====================
class GoogleDriveExtractor:
    """Handles image extraction from Google Drive"""
    
    def __init__(self, credentials_file):
        self.credentials_file = credentials_file
        self.service = None
        
    def authenticate(self):
        """Authenticate with Google Drive using service account"""
        try:
            if not os.path.exists(self.credentials_file):
                print(f"    ❌ Service account file not found: {self.credentials_file}")
                return False
            
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_file,
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            self.service = build('drive', 'v3', credentials=credentials)
            print("    ✅ Google Drive authentication successful")
            return True
            
        except Exception as e:
            print(f"    ❌ Authentication failed: {e}")
            return False
    
    def find_file_by_name(self, file_name):
        """Find a file in Google Drive by name"""
        try:
            if not self.service:
                if not self.authenticate():
                    return None
            
            # Search for file with exact name
            query = f"name = '{file_name}' and trashed = false"
            results = self.service.files().list(
                q=query,
                fields="files(id, name, mimeType)",
                pageSize=10
            ).execute()
            
            files = results.get('files', [])
            if files:
                # Return the first match
                return files[0]
            else:
                # Try partial match if exact match not found
                query = f"name contains '{file_name}' and trashed = false"
                results = self.service.files().list(
                    q=query,
                    fields="files(id, name, mimeType)",
                    pageSize=10
                ).execute()
                files = results.get('files', [])
                if files:
                    print(f"    ⚠ Found partial match: {files[0]['name']}")
                    return files[0]
            
            return None
            
        except Exception as e:
            print(f"    ❌ Error searching for file: {e}")
            return None
    
    def download_image(self, file_identifier, label="image"):
        """
        Download image from Google Drive
        Supports both file ID and file name
        """
        try:
            if not self.service:
                if not self.authenticate():
                    return None, None, None
            
            # Check if it's a file ID (old format) or file name (new format)
            file_id = None
            file_name = None
            
            # Check if it's a file name (contains path structure or .jpg extension)
            if '/' in file_identifier or '.' in file_identifier:
                # It's likely a file name/path
                file_name = file_identifier
                # Extract just the filename from the path if needed
                if '/' in file_name:
                    file_name = file_name.split('/')[-1]
                
                print(f"    🔍 Searching for file by name: {file_name}")
                file_info = self.find_file_by_name(file_name)
                
                if file_info:
                    file_id = file_info['id']
                    actual_name = file_info['name']
                    print(f"    ✅ Found file: {actual_name} (ID: {file_id[:20]}...)")
                else:
                    print(f"    ❌ File not found: {file_name}")
                    return None, None, None
            else:
                # It's likely a file ID (old format)
                file_id = file_identifier
                print(f"    🔍 Using file ID: {file_id[:30]}...")
            
            # Get file metadata
            metadata = self.service.files().get(
                fileId=file_id,
                fields='name, mimeType'
            ).execute()
            
            # Download file
            request = self.service.files().get_media(fileId=file_id)
            file_bytes = BytesIO()
            downloader = MediaIoBaseDownload(file_bytes, request)
            
            done = False
            while not done:
                status, done = downloader.next_chunk()
            
            file_bytes.seek(0)
            img = Image.open(file_bytes)
            
            return img, metadata.get('name', 'unknown'), file_bytes
            
        except Exception as e:
            print(f"    ❌ Error downloading {label}: {e}")
            return None, None, None
        

# ==================== PDF IMAGE MERGER ====================
class PDFMerger:
    """Handles merging of job cards and images with consistent sizing"""
    
    @staticmethod
    def get_job_card_page_size(pdf_path):
        """Get the page size of the job card PDF"""
        try:
            doc = fitz.open(pdf_path)
            if len(doc) > 0:
                page = doc[0]
                size = (page.rect.width, page.rect.height)
                doc.close()
                return size
        except Exception as e:
            print(f"    ⚠ Could not get job card size: {e}")
        return None
    
    @staticmethod
    def resize_image_to_fit(image, target_width, target_height, margin=20):
        """Resize image to fit within target dimensions while maintaining aspect ratio"""
        img_width, img_height = image.size
        
        # Calculate scaling factor to fit within target dimensions
        width_ratio = (target_width - 2*margin) / img_width
        height_ratio = (target_height - 2*margin) / img_height
        
        # Use the smaller ratio to ensure image fits completely
        scale_factor = min(width_ratio, height_ratio)
        
        if scale_factor < 1:  # Only resize if image is larger
            new_width = int(img_width * scale_factor)
            new_height = int(img_height * scale_factor)
            return image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        return image
    
    @staticmethod
    def create_image_pdf(images, account_num, output_path, template_pdf_path=None):
        """Create PDF from images with consistent sizing matching job card"""
        try:
            if not images:
                return False
            
            # Get target page size from job card template
            target_size = None
            if template_pdf_path and os.path.exists(template_pdf_path):
                target_size = PDFMerger.get_job_card_page_size(template_pdf_path)
            
            # Default A4 size if template not available
            if not target_size:
                target_size = (595, 842)  # A4 points (595x842 at 72 DPI)
                print(f"    ℹ Using default A4 size: {target_size}")
            else:
                print(f"    ℹ Using job card size: {target_size}")
            
            # Convert points to pixels at 150 DPI for PIL
            dpi = 150
            points_to_pixels = dpi / 72.0  # 72 points per inch
            target_pixels = (int(target_size[0] * points_to_pixels), 
                           int(target_size[1] * points_to_pixels))
            
            print(f"    ℹ Target pixel size: {target_pixels}")
            
            pdf_images = []
            for i, img_data in enumerate(images):
                if img_data and img_data[0]:
                    img = img_data[0]
                    
                    # Create a new white background image of target size
                    background = Image.new('RGB', target_pixels, 'white')
                    
                    # Resize image to fit
                    resized_img = PDFMerger.resize_image_to_fit(img, target_pixels[0], target_pixels[1])
                    
                    # Calculate position to center the image
                    x = (target_pixels[0] - resized_img.width) // 2
                    y = (target_pixels[1] - resized_img.height) // 2
                    
                    # Paste resized image onto white background
                    background.paste(resized_img, (x, y))
                    
                    pdf_images.append(background)
                    print(f"    ✓ Processed image {i+1}: {resized_img.width}x{resized_img.height} (centered)")
            
            if not pdf_images:
                return False
            
            # Save as PDF with consistent page size
            first_img = pdf_images[0]
            if len(pdf_images) > 1:
                first_img.save(
                    output_path, "PDF", resolution=dpi,
                    save_all=True, append_images=pdf_images[1:],
                    title=f"Meter Photos - Account {account_num}"
                )
            else:
                first_img.save(
                    output_path, "PDF", resolution=dpi,
                    title=f"Meter Photo - Account {account_num}"
                )
            
            print(f"    ✅ Created images PDF with {len(pdf_images)} page(s) - all {target_pixels[0]}x{target_pixels[1]} pixels")
            return True
            
        except Exception as e:
            print(f"    ❌ Error creating image PDF: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    @staticmethod
    def merge_pdfs(pdf1_path, pdf2_path, output_path):
        """Merge two PDFs with consistent page handling"""
        try:
            # Get job card size for reference
            job_card_size = PDFMerger.get_job_card_page_size(pdf1_path)
            
            merger = fitz.open()
            
            # Add first PDF (job card)
            doc1 = fitz.open(pdf1_path)
            merger.insert_pdf(doc1)
            print(f"    ℹ Added job card: {len(doc1)} page(s)")
            doc1.close()
            
            # Add second PDF (images)
            doc2 = fitz.open(pdf2_path)
            merger.insert_pdf(doc2)
            print(f"    ℹ Added images: {len(doc2)} page(s)")
            doc2.close()
            
            # Save merged
            merger.save(output_path)
            merger.close()
            
            return True
            
        except Exception as e:
            print(f"    ❌ Error merging PDFs: {e}")
            return False


# ==================== MAIN PROCESSING CLASS ====================
class UnifiedJobCardProcessor:
    """Main orchestrator for the entire workflow"""
    
    def __init__(self):
        self.job_card_filler = JobCardFiller(CONFIG['template_pdf'])
        self.drive_extractor = GoogleDriveExtractor(CONFIG['service_account_file'])
        self.pdf_merger = PDFMerger()
        
        # Setup paths
        ensure_directories()
        self.job_cards_path = os.path.join(CONFIG['output_base'], CONFIG['job_cards_folder'])
        self.images_path = os.path.join(CONFIG['output_base'], CONFIG['images_folder'])
        self.final_path = os.path.join(CONFIG['output_base'], CONFIG['final_folder'])
        
    def process_all(self):
        """Process all rows from spreadsheet"""
        print("\n" + "="*60)
        print("🚀 STARTING UNIFIED JOB CARD PROCESSING")
        print("="*60)
        
        # Load spreadsheet
        try:
            df = pd.read_excel(CONFIG['spreadsheet'])
            print(f"📊 Loaded {len(df)} rows from spreadsheet")
        except Exception as e:
            print(f"❌ Error loading spreadsheet: {e}")
            return
        
        # Check for required columns
        required_cols = ['Contract Account']
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            print(f"❌ Missing required columns: {missing}")
            return
        
        # Initialize counters
        stats = {
            'total': len(df),
            'job_cards_created': 0,
            'images_downloaded': 0,
            'final_merged': 0,
            'failed': 0
        }
        
        # Process each row
        for idx, row in df.iterrows():
            account = clean_account_number(row.get('Contract Account', ''))
            if not account:
                print(f"\n[{idx+1}/{len(df)}] ⚠ Skipping: No account number")
                stats['failed'] += 1
                continue
            
            print(f"\n[{idx+1}/{len(df)}] Processing account: {account}")
            
            # Step 1: Create filled job card
            job_card_path = os.path.join(self.job_cards_path, f"JOB_CARD_{account}.pdf")
            data = self.job_card_filler.prepare_data(row)
            success, fields = self.job_card_filler.fill_pdf(job_card_path, data)
            
            if success:
                print(f"  ✅ Job card created ({fields} fields filled)")
                stats['job_cards_created'] += 1
            else:
                print(f"  ❌ Failed to create job card")
                stats['failed'] += 1
                continue
            
            # Step 2: Download images
            images = []
            for img_type in ['OldMeterImage', 'NewMeterImage']:
                if img_type in row.index and pd.notna(row[img_type]):
                    img_value = str(row[img_type]).strip().strip('"').strip("'")
                    print(f"  📥 Downloading {img_type}: {img_value}")
                    img_data = self.drive_extractor.download_image(img_value, img_type)
                    if img_data[0]:
                        images.append(img_data)
                        print(f"    ✓ Downloaded successfully")
                    else:
                        print(f"    ✗ Failed to download")
            
            if images:
                stats['images_downloaded'] += 1
                
                # Create images PDF - now passing template path for size reference
                images_pdf_path = os.path.join(self.images_path, f"IMAGES_{account}.pdf")
                if self.pdf_merger.create_image_pdf(images, account, images_pdf_path, CONFIG['template_pdf']):
                    print(f"  ✅ Created images PDF with {len(images)} photo(s) (standardized size)")
                    
                    # Step 3: Merge job card and images
                    final_path = os.path.join(self.final_path, f"FINAL_JOB_CARD_{account}.pdf")
                    if self.pdf_merger.merge_pdfs(job_card_path, images_pdf_path, final_path):
                        print(f"  ✅ Final merged PDF created with consistent page sizes")
                        stats['final_merged'] += 1
                    else:
                        print(f"  ❌ Failed to merge PDFs")
                        stats['failed'] += 1
                else:
                    print(f"  ❌ Failed to create images PDF")
                    stats['failed'] += 1
            else:
                print(f"  ⚠ No images to download")
                # Still copy job card to final folder if no images
                final_path = os.path.join(self.final_path, f"FINAL_JOB_CARD_{account}.pdf")
                import shutil
                shutil.copy2(job_card_path, final_path)
                print(f"  ✅ Job card copied to final folder (no images)")
                stats['final_merged'] += 1
        
        # Print summary
        self.print_summary(stats)
        
    def print_summary(self, stats):
        """Print processing summary"""
        print("\n" + "="*60)
        print("📊 PROCESSING SUMMARY")
        print("="*60)
        print(f"Total accounts processed: {stats['total']}")
        print(f"✅ Job cards created: {stats['job_cards_created']}")
        print(f"✅ Accounts with images: {stats['images_downloaded']}")
        print(f"✅ Final merged PDFs: {stats['final_merged']}")
        print(f"❌ Failed: {stats['failed']}")
        
        print(f"\n📁 Output folders:")
        print(f"  Job cards: {self.job_cards_path}")
        print(f"  Images: {self.images_path}")
        print(f"  Final merged: {self.final_path}")
        
        # List final files
        final_files = [f for f in os.listdir(self.final_path) if f.endswith('.pdf')]
        if final_files:
            print(f"\n📋 Final PDFs created ({len(final_files)}):")
            for f in sorted(final_files)[:10]:
                size = os.path.getsize(os.path.join(self.final_path, f)) / 1024
                print(f"  • {f} ({size:.1f} KB)")
            if len(final_files) > 10:
                print(f"  ... and {len(final_files) - 10} more")

# ==================== MAIN ====================
def main():
    print("""
    ╔══════════════════════════════════════════════════════════╗
    ║     UNIFIED JOB CARD PROCESSING SYSTEM                   ║
    ║     Fill → Extract → Merge in one step                   ║
    ╚══════════════════════════════════════════════════════════╝
    """)
    
    # Check for credentials
    if not os.path.exists(CONFIG['service_account_file']):
        print(f"⚠️  Warning: {CONFIG['service_account_file']} not found")
        print("   Google Drive image extraction will be skipped")
        print("   Only job card creation will be performed\n")
    
    # Run processor
    processor = UnifiedJobCardProcessor()
    processor.process_all()
    
    print("\n" + "="*60)
    print("✨ PROCESSING COMPLETE! ✨")
    print("="*60)

if __name__ == "__main__":
    main()