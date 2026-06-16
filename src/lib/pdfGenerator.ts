import { PDFDocument } from 'pdf-lib';

export async function generateJobCard(workOrder: any, execution: any) {
  try {
    // Fetch the template PDF from the public folder
    const templateBytes = await fetch('/template.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Get the form
    const form = pdfDoc.getForm();

    // Mapping based on Python script logic
    const safeSetText = (fieldName: string, text: string) => {
      try {
        const field = form.getTextField(fieldName);
        if (field) field.setText(text);
      } catch (e) {
        console.warn(`Could not set field ${fieldName}`);
      }
    };

    safeSetText('Customer name', workOrder.customer_name || '');
    safeSetText('Account number', workOrder.account_number || '');
    safeSetText('Address', workOrder.physical_address || '');
    safeSetText('Old Meter NumberRow1', workOrder.meter_serial_number || '');
    
    if (execution) {
      safeSetText('Meter ReadingRow1', execution.old_meter_reading ? String(execution.old_meter_reading) : '');
      safeSetText('New Meter NumberRow1', execution.new_meter_serial || '');
      safeSetText('Regis erRow1', execution.new_meter_reading ? String(execution.new_meter_reading) : '');
      safeSetText('Comment', execution.job_outcome || '');
      safeSetText('Comment2', execution.technician_notes || '');
      
      const execDate = new Date(execution.completion_timestamp);
      safeSetText('Date', `${execDate.getDate()}/${execDate.getMonth() + 1}/${execDate.getFullYear()}`);
    }

    safeSetText('Installed by', 'SISA TSHOLWANA');
    safeSetText('Company', 'LIGHTUP ENTERPRISE');
    safeSetText('Telephone', '0798561362');

    // Make fields read-only
    form.flatten();

    // Embed photos if they exist
    if (execution?.old_meter_photo_url || execution?.new_meter_photo_url) {
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      
      let yOffset = height - 50;

      const embedImage = async (url: string, label: string) => {
        try {
          const imgBytes = await fetch(url).then(res => res.arrayBuffer());
          // Assuming JPEG for now, could be PNG. Try JPEG first.
          let pdfImage;
          try {
            pdfImage = await pdfDoc.embedJpg(imgBytes);
          } catch (e) {
            pdfImage = await pdfDoc.embedPng(imgBytes);
          }
          
          const imgDims = pdfImage.scale(0.3); // Scale down
          
          page.drawText(label, { x: 50, y: yOffset, size: 14 });
          yOffset -= (imgDims.height + 20);
          
          page.drawImage(pdfImage, {
            x: 50,
            y: yOffset,
            width: imgDims.width,
            height: imgDims.height,
          });
          
          yOffset -= 40;
        } catch (e) {
          console.error(`Failed to embed image ${label}:`, e);
        }
      };

      if (execution.old_meter_photo_url) await embedImage(execution.old_meter_photo_url, "Old Meter Photo:");
      if (execution.new_meter_photo_url) await embedImage(execution.new_meter_photo_url, "New Meter Photo:");
    }

    const pdfBytes = await pdfDoc.save();
    
    // Download logic
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `JOB_CARD_${workOrder.account_number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (err) {
    console.error("Error generating PDF:", err);
    alert("Could not generate PDF. Check console for details.");
  }
}
