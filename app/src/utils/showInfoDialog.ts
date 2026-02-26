interface InfoDialogOptions {
    message: string;
    okLabel?: string;
}

export function showInfoDialog(options: InfoDialogOptions): void {
    const { message, okLabel = 'OK' } = options;

    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    });

    const dialog = document.createElement('div');
    Object.assign(dialog.style, {
        backgroundColor: 'var(--notifications-background, var(--editor-background, #252526))',
        color: 'var(--notifications-foreground, var(--foreground, #ccc))',
        borderRadius: '6px',
        boxShadow: 'var(--widget-shadow, rgba(0,0,0,0.36)) 0px 0px 8px 2px',
        border: '1px solid var(--widget-border, transparent)',
        minWidth: '320px',
        maxWidth: '480px',
        padding: '0',
        fontFamily: 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        fontSize: '13px',
        overflow: 'hidden',
    });

    const body = document.createElement('div');
    Object.assign(body.style, {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '20px 20px 16px 20px',
    });

    const icon = document.createElement('div');
    Object.assign(icon.style, {
        fontSize: '24px',
        lineHeight: '1',
        flexShrink: '0',
        marginTop: '2px',
    });
    icon.textContent = '\u2139';

    const msg = document.createElement('div');
    Object.assign(msg.style, { lineHeight: '1.5', wordBreak: 'break-word' });
    msg.textContent = message;

    body.appendChild(icon);
    body.appendChild(msg);

    const footer = document.createElement('div');
    Object.assign(footer.style, {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0 20px 16px 20px',
    });

    const okBtn = document.createElement('button');
    okBtn.textContent = okLabel;
    Object.assign(okBtn.style, {
        padding: '4px 14px',
        fontSize: '13px',
        lineHeight: '20px',
        border: '1px solid var(--button-border, var(--contrastBorder, transparent))',
        borderRadius: '2px',
        cursor: 'pointer',
        outline: 'none',
        fontFamily: 'inherit',
        backgroundColor: 'var(--button-background, #0E639C)',
        color: 'var(--button-foreground, #fff)',
    });
    okBtn.addEventListener('mouseenter', () => { okBtn.style.opacity = '0.9'; });
    okBtn.addEventListener('mouseleave', () => { okBtn.style.opacity = '1'; });

    footer.appendChild(okBtn);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);

    function cleanup() {
        document.removeEventListener('keydown', onKeyDown);
        overlay.remove();
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' || e.key === 'Enter') {
            e.stopPropagation();
            cleanup();
        }
    }

    okBtn.addEventListener('click', cleanup);
    document.addEventListener('keydown', onKeyDown, true);
    document.body.appendChild(overlay);
    okBtn.focus();
}
