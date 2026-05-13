// Heavy libraries loaded dynamically to optimize initial bundle size
// import html2canvas from 'html2canvas';
// import { jsPDF } from 'jspdf';

const CERTIFICATE_WIDTH = 1123;
const CERTIFICATE_HEIGHT = 794;

const safeText = (value, fallback) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalized = String(value).replace(/\s+/g, ' ').trim();
  return normalized || fallback;
};

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDuration = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Self-paced';
  }

  if (parsed < 60) {
    return `${parsed} minutes`;
  }

  const hours = Math.floor(parsed / 60);
  const minutes = parsed % 60;
  if (minutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  return `${hours}h ${minutes}m`;
};

const resolveStudentName = (rawName) => {
  const normalized = safeText(rawName, '');
  if (!normalized) {
    return 'Valued Learner';
  }

  if (normalized.includes('@')) {
    return normalized.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Valued Learner';
  }

  return normalized;
};

/**
 * Generates a completion certificate PDF.
 * @param {Object} data - { studentName, courseName, instructorName, date, level, duration, verificationCode, enrolledDate, completedDate }
 * @param {boolean} shouldDownload - whether to trigger browser download
 * @returns {Promise<Object>} - { blob, base64, filename }
 */
export const generateCertificatePDF = async (data, shouldDownload = true) => {
  // Load heavy libraries only when this function is called
  const [html2canvas, { jsPDF }] = await Promise.all([
    import('html2canvas').then(m => m.default),
    import('jspdf')
  ]);

  const studentName = resolveStudentName(data?.studentName);
  const courseName = safeText(data?.courseName, 'Course Name');
  const instructorName = safeText(data?.instructorName, 'LMS Instructor');
  const date = safeText(data?.date, new Date().toLocaleDateString());
  const level = safeText(data?.level, 'Beginner');
  const duration = formatDuration(data?.duration);
  const verificationCode = safeText(data?.verificationCode, 'VERIFY-123');
  const enrolledDate = safeText(data?.enrolledDate, 'N/A');
  const completedDate = safeText(data?.completedDate, 'N/A');

  const certElement = document.createElement('div');
  certElement.style.width = `${CERTIFICATE_WIDTH}px`;
  certElement.style.height = `${CERTIFICATE_HEIGHT}px`;
  certElement.style.position = 'fixed';
  certElement.style.left = '-9999px';
  certElement.style.top = '-9999px';
  certElement.style.background = '#f7f1e3';
  certElement.style.color = '#1f2937';
  certElement.style.fontFamily = '"Georgia", "Times New Roman", serif';
  certElement.style.boxSizing = 'border-box';
  certElement.style.overflow = 'hidden';

  certElement.innerHTML = `
    <div style="width: 100%; height: 100%; padding: 24px; box-sizing: border-box; background: linear-gradient(135deg, #f8f2e8 0%, #fdfaf5 50%, #efe4cf 100%);">
      <div style="position: relative; width: 100%; height: 100%; border: 10px solid #bb9457; box-sizing: border-box; padding: 38px 52px; overflow: hidden;">
        <div style="position: absolute; inset: 12px; border: 2px solid rgba(187, 148, 87, 0.45);"></div>
        <div style="position: absolute; top: -40px; right: -40px; width: 240px; height: 240px; border-radius: 50%; background: radial-gradient(circle, rgba(187,148,87,0.18) 0%, transparent 72%);"></div>
        <div style="position: absolute; bottom: -70px; left: -40px; width: 260px; height: 260px; border-radius: 50%; background: radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 72%);"></div>

        <div style="position: relative; z-index: 1; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="text-align: center;">
            <div style="font-family: Arial, sans-serif; font-size: 13px; letter-spacing: 0.4em; text-transform: uppercase; color: #8a6a3c; font-weight: 700; margin-bottom: 14px;">
              Online Learning Management System
            </div>
            <div style="font-size: 44px; font-weight: 700; letter-spacing: 0.08em; color: #6f4e1f; text-transform: uppercase; margin-bottom: 12px;">
              Certificate of Completion
            </div>
            <div style="width: 180px; height: 2px; background: linear-gradient(90deg, transparent, #bb9457, transparent); margin: 0 auto 20px;"></div>
            <div style="font-family: Arial, sans-serif; font-size: 18px; color: #5b6472;">
              This certifies that
            </div>
            <div style="margin: 18px auto 10px; max-width: 860px; font-size: 52px; line-height: 1.08; font-weight: 700; color: #0f172a; word-break: break-word;">
              ${escapeHtml(studentName)}
            </div>
            <div style="font-family: Arial, sans-serif; font-size: 18px; color: #5b6472; margin-bottom: 14px;">
              has successfully completed the course
            </div>
            <div style="margin: 0 auto; max-width: 900px; font-size: 34px; line-height: 1.2; font-weight: 700; color: #7c2d12; word-break: break-word;">
              ${escapeHtml(courseName)}
            </div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0 18px;">
            <div style="padding: 16px 14px; background: rgba(255,255,255,0.6); border: 1px solid rgba(187,148,87,0.35); text-align: center;">
              <div style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #8a6a3c; margin-bottom: 8px;">Enrolled</div>
              <div style="font-family: Arial, sans-serif; font-size: 17px; font-weight: 700; color: #1f2937;">${escapeHtml(enrolledDate)}</div>
            </div>
            <div style="padding: 16px 14px; background: rgba(255,255,255,0.6); border: 1px solid rgba(187,148,87,0.35); text-align: center;">
              <div style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #8a6a3c; margin-bottom: 8px;">Completed</div>
              <div style="font-family: Arial, sans-serif; font-size: 17px; font-weight: 700; color: #1f2937;">${escapeHtml(completedDate)}</div>
            </div>
            <div style="padding: 16px 14px; background: rgba(255,255,255,0.6); border: 1px solid rgba(187,148,87,0.35); text-align: center;">
              <div style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #8a6a3c; margin-bottom: 8px;">Duration</div>
              <div style="font-family: Arial, sans-serif; font-size: 17px; font-weight: 700; color: #1f2937;">${escapeHtml(duration)}</div>
            </div>
            <div style="padding: 16px 14px; background: rgba(255,255,255,0.6); border: 1px solid rgba(187,148,87,0.35); text-align: center;">
              <div style="font-family: Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #8a6a3c; margin-bottom: 8px;">Level</div>
              <div style="font-family: Arial, sans-serif; font-size: 17px; font-weight: 700; color: #1f2937;">${escapeHtml(level)}</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 24px;">
            <div style="flex: 1; text-align: center;">
              <div style="height: 56px; display: flex; align-items: flex-end; justify-content: center; font-size: 28px; font-style: italic; color: #7c2d12;">
                ${escapeHtml(instructorName)}
              </div>
              <div style="border-bottom: 1.5px solid #7c2d12; margin: 8px auto 10px; width: 240px;"></div>
              <div style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1f2937;">${escapeHtml(instructorName)}</div>
              <div style="font-family: Arial, sans-serif; font-size: 11px; color: #8a6a3c; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px;">Instructor</div>
            </div>

            <div style="width: 120px; height: 120px; border-radius: 50%; border: 3px solid rgba(187,148,87,0.7); display: flex; align-items: center; justify-content: center; text-align: center; color: #8a6a3c; font-family: Arial, sans-serif; background: rgba(255,255,255,0.52); box-sizing: border-box;">
              <div>
                <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;">Verified</div>
                <div style="font-size: 22px; font-weight: 700; margin: 4px 0;">LMS</div>
                <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;">Graduate</div>
              </div>
            </div>

            <div style="flex: 1; text-align: center;">
              <div style="height: 56px; display: flex; align-items: flex-end; justify-content: center; font-size: 28px; font-style: italic; color: #0f766e;">
                Academic Office
              </div>
              <div style="border-bottom: 1.5px solid #0f766e; margin: 8px auto 10px; width: 240px;"></div>
              <div style="font-family: Arial, sans-serif; font-size: 15px; font-weight: 700; color: #1f2937;">Academic Office</div>
              <div style="font-family: Arial, sans-serif; font-size: 11px; color: #8a6a3c; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px;">Certification Authority</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; font-family: Arial, sans-serif; margin-top: 12px; color: #5b6472;">
            <div style="font-size: 12px;">
              <span style="font-weight: 700; color: #6f4e1f;">Certificate ID:</span> ${escapeHtml(verificationCode)}
            </div>
            <div style="font-size: 12px; text-align: right;">
              <span style="font-weight: 700; color: #6f4e1f;">Issued:</span> ${escapeHtml(date)}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(certElement);

  try {
    const canvas = await html2canvas(certElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f7f1e3'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, CERTIFICATE_WIDTH, CERTIFICATE_HEIGHT);

    const filename = `Certificate-${courseName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'Course'}.pdf`;
    if (shouldDownload) {
      pdf.save(filename);
    }

    const pdfBase64 = pdf.output('datauristring').split(',')[1];

    return {
      filename,
      base64: pdfBase64,
      pdf,
      blob: pdf.output('blob')
    };
  } catch (error) {
    console.error('PDF Generation failed:', error);
    throw error;
  } finally {
    document.body.removeChild(certElement);
  }
};
