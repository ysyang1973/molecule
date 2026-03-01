import { useCallback, useEffect, useRef, useState } from 'react';

import './index.scss';

interface TerminalLine {
    type: 'command' | 'result' | 'error' | 'welcome';
    content: string;
}

const WELCOME_MESSAGE = `Mock Terminal v1.0.0
Type 'help' to see available commands.
`;

const MOCK_FILES = ['README.md', 'package.json', 'src/', 'node_modules/', 'tsconfig.json', 'vite.config.ts'];

function executeCommand(input: string): TerminalLine[] {
    const trimmed = input.trim();
    if (!trimmed) return [];

    const [cmd, ...args] = trimmed.split(/\s+/);
    const lines: TerminalLine[] = [{ type: 'command', content: trimmed }];

    switch (cmd.toLowerCase()) {
        case 'help':
            lines.push({
                type: 'result',
                content: [
                    'Available commands:',
                    '  help          Show available commands',
                    '  echo <text>   Print text',
                    '  clear         Clear screen',
                    '  date          Current date/time',
                    '  pwd           Current directory',
                    '  ls            List files',
                    '  whoami        Current user',
                    '  env           Environment variables',
                ].join('\n'),
            });
            break;

        case 'echo':
            lines.push({ type: 'result', content: args.join(' ') });
            break;

        case 'clear':
            return [{ type: 'command', content: '__CLEAR__' }];

        case 'date':
            lines.push({ type: 'result', content: new Date().toLocaleString() });
            break;

        case 'pwd':
            lines.push({ type: 'result', content: '/home/user/workspace' });
            break;

        case 'ls':
            lines.push({ type: 'result', content: MOCK_FILES.join('  ') });
            break;

        case 'whoami':
            lines.push({ type: 'result', content: 'user' });
            break;

        case 'env':
            lines.push({
                type: 'result',
                content: [
                    'SHELL=/bin/bash',
                    'USER=user',
                    'HOME=/home/user',
                    'LANG=ko_KR.UTF-8',
                    'TERM=xterm-256color',
                ].join('\n'),
            });
            break;

        default:
            lines.push({
                type: 'error',
                content: `bash: ${cmd}: command not found`,
            });
            break;
    }

    return lines;
}

export default function Terminal() {
    const [lines, setLines] = useState<TerminalLine[]>([{ type: 'welcome', content: WELCOME_MESSAGE }]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const outputRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [lines, scrollToBottom]);

    const handleSubmit = useCallback(() => {
        const trimmed = input.trim();
        if (!trimmed) {
            setLines((prev) => [...prev, { type: 'command', content: '' }]);
            setInput('');
            return;
        }

        const result = executeCommand(trimmed);

        if (result.length === 1 && result[0].content === '__CLEAR__') {
            setLines([]);
        } else {
            setLines((prev) => [...prev, ...result]);
        }

        setHistory((prev) => [...prev, trimmed]);
        setHistoryIndex(-1);
        setInput('');
    }, [input]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (history.length === 0) return;
                const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
                setHistoryIndex(nextIndex);
                setInput(history[nextIndex]);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIndex === -1) return;
                const nextIndex = historyIndex + 1;
                if (nextIndex >= history.length) {
                    setHistoryIndex(-1);
                    setInput('');
                } else {
                    setHistoryIndex(nextIndex);
                    setInput(history[nextIndex]);
                }
            } else if (e.key === 'l' && e.ctrlKey) {
                e.preventDefault();
                setLines([]);
            }
        },
        [handleSubmit, history, historyIndex]
    );

    const handleContainerClick = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="terminal" onClick={handleContainerClick}>
            <div className="terminal__output" ref={outputRef}>
                {lines.map((line, i) => {
                    if (line.type === 'welcome') {
                        return (
                            <div key={i} className="terminal__welcome">
                                {line.content}
                            </div>
                        );
                    }
                    if (line.type === 'command') {
                        return (
                            <div key={i} className="terminal__line">
                                <span className="terminal__prompt">$</span>
                                <span className="terminal__command">{line.content}</span>
                            </div>
                        );
                    }
                    return (
                        <div
                            key={i}
                            className={`terminal__result${line.type === 'error' ? ' terminal__result--error' : ''}`}
                        >
                            {line.content}
                        </div>
                    );
                })}
            </div>
            <div className="terminal__input-line">
                <span className="terminal__input-prompt">$</span>
                <input
                    ref={inputRef}
                    className="terminal__input"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setHistoryIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    autoComplete="off"
                    autoFocus
                />
            </div>
        </div>
    );
}
