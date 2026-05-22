const ALLOWED_PROPERTIES = new Set(['width', 'height', 'marginLeft', 'marginTop']);

function parsePixelValue(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function createUiInspectorTemporaryStyles() {
  const originalInlineByElement = new Map();
  const previewStateById = new Map();

  function ensureOriginalInlineStyle(targetElement) {
    if (!targetElement || originalInlineByElement.has(targetElement)) return;
    const cssText = String(targetElement.style?.cssText || '');
    originalInlineByElement.set(targetElement, cssText);
  }

  function applyDelta(targetElement, property, delta, id = '') {
    if (!targetElement || !ALLOWED_PROPERTIES.has(property) || !Number.isFinite(delta)) return false;
    ensureOriginalInlineStyle(targetElement);
    const currentValue = parsePixelValue(targetElement.style?.[property]);
    targetElement.style[property] = `${currentValue + delta}px`;
    previewStateById.set(String(id || ''), {
      ...(previewStateById.get(String(id || '')) || {}),
      [property]: targetElement.style[property],
    });
    return true;
  }

  function toggleVisibility(targetElement, id = '') {
    if (!targetElement) return false;
    ensureOriginalInlineStyle(targetElement);
    const nextVisibility = targetElement.style?.visibility === 'hidden' ? 'visible' : 'hidden';
    targetElement.style.visibility = nextVisibility;
    previewStateById.set(String(id || ''), {
      ...(previewStateById.get(String(id || '')) || {}),
      visibility: nextVisibility,
    });
    return true;
  }

  function resetElement(targetElement, id = '') {
    if (!targetElement || !originalInlineByElement.has(targetElement)) return false;
    targetElement.style.cssText = originalInlineByElement.get(targetElement) || '';
    originalInlineByElement.delete(targetElement);
    previewStateById.delete(String(id || ''));
    return true;
  }

  function resetAll() {
    for (const [element, cssText] of originalInlineByElement.entries()) {
      element.style.cssText = cssText || '';
    }
    originalInlineByElement.clear();
    previewStateById.clear();
    return true;
  }

  function getPreviewState(id = '') {
    return previewStateById.get(String(id || '')) || null;
  }

  return { applyDelta, toggleVisibility, resetElement, resetAll, getPreviewState };
}
