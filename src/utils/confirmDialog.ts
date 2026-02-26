export type InfoDialogResult = 'ok';

export interface InfoDialogOptions {
    message: string;
    okLabel?: string;
}

/**
 * Shows a themed info dialog with a single OK button.
 */
export function showInfoDialog(options: InfoDialogOptions): Promise<InfoDialogResult> {
    const { message, okLabel = 'OK' } = options;

    return new Promise<InfoDialogResult>((resolve) => {
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
        } as CSSStyleDeclaration);

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
        } as CSSStyleDeclaration);

        const body = document.createElement('div');
        Object.assign(body.style, {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '20px 20px 16px 20px',
        } as CSSStyleDeclaration);

        const icon = document.createElement('div');
        Object.assign(icon.style, {
            fontSize: '24px',
            lineHeight: '1',
            flexShrink: '0',
            marginTop: '2px',
        } as CSSStyleDeclaration);
        icon.textContent = '\u2139'; // ℹ

        const msg = document.createElement('div');
        Object.assign(msg.style, {
            lineHeight: '1.5',
            wordBreak: 'break-word',
        } as CSSStyleDeclaration);
        msg.textContent = message;

        body.appendChild(icon);
        body.appendChild(msg);

        const footer = document.createElement('div');
        Object.assign(footer.style, {
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 20px 16px 20px',
        } as CSSStyleDeclaration);

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
        } as CSSStyleDeclaration);
        okBtn.addEventListener('mouseenter', () => { okBtn.style.opacity = '0.9'; });
        okBtn.addEventListener('mouseleave', () => { okBtn.style.opacity = '1'; });

        footer.appendChild(okBtn);
        dialog.appendChild(body);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);

        function cleanup() {
            document.removeEventListener('keydown', onKeyDown);
            overlay.remove();
            resolve('ok');
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
    });
}

export type ConfirmDialogResult = 'save' | 'dontsave' | 'cancel';

export interface ConfirmDialogOptions {
    message: string;
    saveLabel?: string;
    dontSaveLabel?: string;
    cancelLabel?: string;
}

/**
 * Shows a themed confirmation dialog for unsaved changes.
 * Returns a Promise that resolves with the user's choice.
 */
export function showConfirmDialog(options: ConfirmDialogOptions): Promise<ConfirmDialogResult> {
    const { message, saveLabel = 'Save', dontSaveLabel = "Don't Save", cancelLabel = 'Cancel' } = options;

    return new Promise<ConfirmDialogResult>((resolve) => {
        // Overlay
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
        } as CSSStyleDeclaration);

        // Dialog container
        const dialog = document.createElement('div');
        Object.assign(dialog.style, {
            backgroundColor: 'var(--notifications-background, var(--editor-background, #252526))',
            color: 'var(--notifications-foreground, var(--foreground, #ccc))',
            borderRadius: '6px',
            boxShadow: 'var(--widget-shadow, rgba(0,0,0,0.36)) 0px 0px 8px 2px',
            border: '1px solid var(--widget-border, transparent)',
            minWidth: '360px',
            maxWidth: '480px',
            padding: '0',
            fontFamily: 'var(--font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
            fontSize: '13px',
            overflow: 'hidden',
        } as CSSStyleDeclaration);

        // Icon + message area
        const body = document.createElement('div');
        Object.assign(body.style, {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '20px 20px 16px 20px',
        } as CSSStyleDeclaration);

        // Warning icon
        const icon = document.createElement('div');
        Object.assign(icon.style, {
            fontSize: '24px',
            lineHeight: '1',
            flexShrink: '0',
            marginTop: '2px',
        } as CSSStyleDeclaration);
        icon.textContent = '\u26A0'; // ⚠

        // Message text
        const msg = document.createElement('div');
        Object.assign(msg.style, {
            lineHeight: '1.5',
            wordBreak: 'break-word',
        } as CSSStyleDeclaration);
        msg.textContent = message;

        body.appendChild(icon);
        body.appendChild(msg);

        // Button area
        const footer = document.createElement('div');
        Object.assign(footer.style, {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            padding: '0 20px 16px 20px',
        } as CSSStyleDeclaration);

        function createButton(label: string, primary: boolean): HTMLButtonElement {
            const btn = document.createElement('button');
            btn.textContent = label;
            Object.assign(btn.style, {
                padding: '4px 14px',
                fontSize: '13px',
                lineHeight: '20px',
                border: primary
                    ? '1px solid var(--button-border, var(--contrastBorder, transparent))'
                    : '1px solid var(--button-secondaryBackground, var(--contrastBorder, #3A3D41))',
                borderRadius: '2px',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
                backgroundColor: primary
                    ? 'var(--button-background, #0E639C)'
                    : 'var(--button-secondaryBackground, #3A3D41)',
                color: primary
                    ? 'var(--button-foreground, #fff)'
                    : 'var(--button-secondaryForeground, #fff)',
            } as CSSStyleDeclaration);

            btn.addEventListener('mouseenter', () => {
                btn.style.opacity = '0.9';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.opacity = '1';
            });

            return btn;
        }

        const dontSaveBtn = createButton(dontSaveLabel, false);
        const cancelBtn = createButton(cancelLabel, false);
        const saveBtn = createButton(saveLabel, true);

        footer.appendChild(dontSaveBtn);
        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);

        dialog.appendChild(body);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);

        function cleanup(result: ConfirmDialogResult) {
            document.removeEventListener('keydown', onKeyDown);
            overlay.remove();
            resolve(result);
        }

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.stopPropagation();
                cleanup('cancel');
            } else if (e.key === 'Enter') {
                e.stopPropagation();
                cleanup('save');
            }
        }

        dontSaveBtn.addEventListener('click', () => cleanup('dontsave'));
        cancelBtn.addEventListener('click', () => cleanup('cancel'));
        saveBtn.addEventListener('click', () => cleanup('save'));

        document.addEventListener('keydown', onKeyDown, true);
        document.body.appendChild(overlay);

        // Focus save button by default
        saveBtn.focus();
    });
}
