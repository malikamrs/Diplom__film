export default function showAlert(message) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';

    const box = document.createElement('div');
    box.style.backgroundColor = '#fff';
    box.style.padding = '30px';
    box.style.borderRadius = '3px';
    box.style.boxShadow = '0 12px 48px rgba(0,0,0,0.45)';
    box.style.maxWidth = '400px';
    box.style.textAlign = 'center';
    box.style.fontFamily = 'Roboto, sans-serif';

    const text = document.createElement('p');
    text.textContent = message;
    text.style.marginBottom = '25px';
    text.style.fontSize = '16px';
    text.style.color = '#333';
    text.style.lineHeight = '1.5';

    const btn = document.createElement('button');
    btn.textContent = 'ОК';
    btn.style.padding = '12px 30px';
    btn.style.border = 'none';
    btn.style.backgroundColor = '#16A6AF';
    btn.style.color = '#fff';
    btn.style.fontWeight = '500';
    btn.style.textTransform = 'uppercase';
    btn.style.borderRadius = '3px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

    btn.onclick = () => overlay.remove();

    box.append(text, btn);
    overlay.append(box);
    document.body.append(overlay);
}
