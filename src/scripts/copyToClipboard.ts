import { toast } from 'react-toastify';

export function _copyToClipboard(text?: string, name?: string) {
    if (!text) return;
    const input = document.createElement('input');
    input.value = text;
    input.style.cssText = 'opacity: 0; z-index:-10000;';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
    toast.info(`${name ?? ''} کپی شد`);
}
