// PDF Export utility using jsPDF + html2canvas
// Supports math expressions rendered via KaTeX

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Fetch and convert an image URL to a base64 Data URL.
 * This prevents CORS or local path issues during canvas rendering.
 */
async function getBase64Image(imgUrl) {
  try {
    const res = await fetch(imgUrl);
    if (!res.ok) throw new Error('Image fetch failed');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Error loading logo as base64:', e);
    return '';
  }
}

/**
 * Creates a standard A4 size page container element styled for print.
 */
function createPageContainer() {
  const page = document.createElement('div');
  page.style.width = '800px';
  page.style.height = 'auto'; // Start with auto height to measure content
  page.style.padding = '40px';
  page.style.backgroundColor = '#ffffff';
  page.style.color = '#1e293b'; // slate-800
  page.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
  page.style.boxSizing = 'border-box';
  page.style.position = 'relative';
  page.style.display = 'block';
  return page;
}

/**
 * Export a DOM element to PDF.
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} filename - The output filename (without .pdf)
 * @param {Object} metadata - Optional metadata details (topic, subject, examType, notesType)
 */
export async function exportToPDF(element, filename = 'notes', metadata = null) {
  if (!element) throw new Error('No element provided for PDF export.');

  // Fetch the Self Ranker logo as base64
  const logoBase64 = await getBase64Image('/Assets/Logos/Logo (MAIN).png');

  // Backup window scroll positions
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  // Create temporary container for PDF capture (positioned far off-screen to prevent bleeding through transparent dashboard cards)
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '-9999px';
  wrapper.style.width = '800px';
  wrapper.style.height = 'auto'; // Grow automatically to fit content
  wrapper.style.overflow = 'visible';
  wrapper.style.zIndex = '-9999';
  wrapper.style.pointerEvents = 'none';
  wrapper.style.backgroundColor = '#ffffff';
  document.body.appendChild(wrapper);

  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.display = 'block';
  wrapper.appendChild(container);

  // 1. Header Section (Logo + Title)
  let headerHtml = `
    <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 12px;">
  `;

  if (logoBase64) {
    headerHtml += `<img src="${logoBase64}" style="height: 38px; width: auto; object-fit: contain;" />`;
  } else {
    headerHtml += `
      <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 18px;">
        SR
      </div>
    `;
  }

  headerHtml += `
        <span style="font-size: 24px; font-weight: 800; color: #6d28d9; letter-spacing: -0.025em; font-family: system-ui, sans-serif;">Self Ranker</span>
      </div>
      <div style="text-align: right;">
        <span style="font-size: 11px; font-weight: 700; color: #7c3aed; background-color: #f5f3ff; padding: 6px 12px; border-radius: 9999px; border: 1px solid #ddd6fe; text-transform: uppercase; letter-spacing: 0.05em;">AI Study Notes</span>
      </div>
    </div>
  `;

  // 2. Metadata Section
  let metadataHtml = '';
  if (metadata) {
    const { topic, subject, examType, notesType } = metadata;
    metadataHtml = `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; background-color: #faf5ff; border: 1px solid #f3e8ff; padding: 20px; border-radius: 12px; margin-bottom: 30px; box-sizing: border-box;">
        <div>
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #86198f; opacity: 0.8; letter-spacing: 0.05em; margin-bottom: 2px;">Topic</div>
          <div style="font-size: 15px; font-weight: 700; color: #1e1b4b;">${topic || 'N/A'}</div>
        </div>
        <div>
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #86198f; opacity: 0.8; letter-spacing: 0.05em; margin-bottom: 2px;">Subject</div>
          <div style="font-size: 15px; font-weight: 700; color: #1e1b4b;">${subject || 'N/A'}</div>
        </div>
        <div>
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #86198f; opacity: 0.8; letter-spacing: 0.05em; margin-bottom: 2px;">Exam Target</div>
          <div style="font-size: 15px; font-weight: 700; color: #1e1b4b;">${examType || 'N/A'}</div>
        </div>
        <div>
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #86198f; opacity: 0.8; letter-spacing: 0.05em; margin-bottom: 2px;">Notes Type</div>
          <div style="font-size: 15px; font-weight: 700; color: #1e1b4b;">${notesType || 'N/A'}</div>
        </div>
        <div style="grid-column: span 2; border-top: 1px solid #f3e8ff; margin-top: 8px; padding-top: 8px;">
          <div style="font-size: 10px; color: #6b21a8; opacity: 0.7; font-weight: 500;">
            Generated on: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} at ${new Date().toLocaleTimeString('en-US', { timeStyle: 'short' })}
          </div>
        </div>
      </div>
    `;
  }

  // Clone the actual notes element containing Markdown/KaTeX structure
  const contentClone = element.cloneNode(true);

  // Clean Grammarly & Spellchecker annotations from clone
  const cleanClone = (node) => {
    const extensions = node.querySelectorAll('grammarly-extension, grammarly-popups, [data-gr-id]');
    extensions.forEach(el => el.parentNode.removeChild(el));

    const wrappers = node.querySelectorAll('[class*="grammarly"], [id*="grammarly"], [class*="spellcheck"], [class*="grammar"], [data-gramm]');
    wrappers.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        const fragment = document.createDocumentFragment();
        while (el.firstChild) {
          fragment.appendChild(el.firstChild);
        }
        parent.replaceChild(fragment, el);
      }
    });
  };
  cleanClone(contentClone);

  const children = Array.from(contentClone.children);
  const pages = [];

  // Create the first page
  let currentPage = createPageContainer();
  currentPage.innerHTML = headerHtml + metadataHtml;
  currentPage.setAttribute('spellcheck', 'false');

  // Add the markdown content wrapper div for styling
  let currentContentArea = document.createElement('div');
  currentContentArea.className = 'prose prose-slate max-w-none';
  currentContentArea.style.fontSize = '14.5px';
  currentContentArea.style.color = '#334155';
  currentContentArea.style.padding = '0';
  currentContentArea.style.margin = '0';
  currentPage.appendChild(currentContentArea);

  container.appendChild(currentPage);
  pages.push(currentPage);

  // Distribute markdown child elements across pages based on height, splitting lists where needed
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const tagName = child.tagName.toLowerCase();

    if (tagName === 'ul' || tagName === 'ol') {
      let listContainer = document.createElement(tagName);
      listContainer.className = child.className;
      listContainer.style.cssText = child.style.cssText;
      currentContentArea.appendChild(listContainer);

      const liItems = Array.from(child.children);
      for (let j = 0; j < liItems.length; j++) {
        const li = liItems[j];
        const liClone = li.cloneNode(true);
        listContainer.appendChild(liClone);

        // Threshold of 1050px allows spacing safety for A4 bottom margins
        if (currentPage.offsetHeight > 1050) {
          if (listContainer.children.length > 1 || currentContentArea.children.length > 1) {
            listContainer.removeChild(liClone);

            if (listContainer.children.length === 0) {
              currentContentArea.removeChild(listContainer);
            }

            // Start a new page
            currentPage = createPageContainer();
            currentPage.setAttribute('spellcheck', 'false');
            currentContentArea = document.createElement('div');
            currentContentArea.className = 'prose prose-slate max-w-none';
            currentContentArea.style.fontSize = '14.5px';
            currentContentArea.style.color = '#334155';
            currentContentArea.style.padding = '0';
            currentContentArea.style.margin = '0';
            currentPage.appendChild(currentContentArea);

            container.appendChild(currentPage);
            pages.push(currentPage);

            // Re-create the list container on the new page
            listContainer = document.createElement(tagName);
            listContainer.className = child.className;
            listContainer.style.cssText = child.style.cssText;
            currentContentArea.appendChild(listContainer);
            listContainer.appendChild(liClone);
          }
        }
      }
    } else {
      // For headers, paragraphs, or KaTeX math blocks, add them as single blocks
      const childClone = child.cloneNode(true);
      currentContentArea.appendChild(childClone);

      if (currentPage.offsetHeight > 1050) {
        if (currentContentArea.children.length > 1) {
          currentContentArea.removeChild(childClone);

          // Start a new page
          currentPage = createPageContainer();
          currentPage.setAttribute('spellcheck', 'false');
          currentContentArea = document.createElement('div');
          currentContentArea.className = 'prose prose-slate max-w-none';
          currentContentArea.style.fontSize = '14.5px';
          currentContentArea.style.color = '#334155';
          currentContentArea.style.padding = '0';
          currentContentArea.style.margin = '0';
          currentPage.appendChild(currentContentArea);

          container.appendChild(currentPage);
          pages.push(currentPage);

          currentContentArea.appendChild(childClone);
        }
      }
    }
  }

  // Finalize all page containers to exact A4 height (1131px) and append page numbers
  pages.forEach((p, idx) => {
    p.style.height = '1131px';
    p.style.overflow = 'hidden';

    const pageNumDiv = document.createElement('div');
    pageNumDiv.style.position = 'absolute';
    pageNumDiv.style.bottom = '20px';
    pageNumDiv.style.right = '40px';
    pageNumDiv.style.fontSize = '10px';
    pageNumDiv.style.fontWeight = '600';
    pageNumDiv.style.color = '#94a3b8';
    pageNumDiv.style.fontFamily = "system-ui, sans-serif";
    pageNumDiv.innerText = `Page ${idx + 1} of ${pages.length}`;
    p.appendChild(pageNumDiv);
  });

  // Clear the container wrapper so we can mount pages one by one during canvas generation
  container.innerHTML = '';

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  try {
    // Wait for fonts to be ready
    await document.fonts.ready;

    // Capture pages sequentially, inserting a small non-blocking delay to keep the UI active
    for (let i = 0; i < pages.length; i++) {
      const pageElement = pages[i];
      container.appendChild(pageElement);

      // Yield execution to the browser paint loop to keep the loading spinner animating
      await new Promise((resolve) => setTimeout(resolve, 60));

      const canvas = await html2canvas(pageElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 800,
        windowHeight: 1131,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      // Remove page from DOM to free memory
      container.removeChild(pageElement);
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  } finally {
    // Restore original window scroll position
    window.scrollTo(originalScrollX, originalScrollY);

    // Clean up temporary wrapper from DOM
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}
