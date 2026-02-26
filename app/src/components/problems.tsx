import { useState, useEffect, useCallback } from 'react';
import { editor, MarkerSeverity } from 'monaco-editor/esm/vs/editor/editor.api';
import type { IMoleculeContext } from '@dtinsight/molecule';

import './problems.css';

export const PROBLEMS_PANEL_ID = 'panel.item.problems';
const PANEL_ID = PROBLEMS_PANEL_ID;

interface MarkerGroup {
    uri: string;
    fileName: string;
    markers: editor.IMarker[];
}

function getSeverityIcon(severity: MarkerSeverity) {
    switch (severity) {
        case MarkerSeverity.Error:
            return 'error';
        case MarkerSeverity.Warning:
            return 'warning';
        case MarkerSeverity.Info:
            return 'info';
        case MarkerSeverity.Hint:
            return 'lightbulb';
        default:
            return 'info';
    }
}

function getSeverityClass(severity: MarkerSeverity) {
    switch (severity) {
        case MarkerSeverity.Error:
            return 'problems-severity-error';
        case MarkerSeverity.Warning:
            return 'problems-severity-warning';
        default:
            return 'problems-severity-info';
    }
}

function buildMarkerGroups(allMarkers: editor.IMarker[]): MarkerGroup[] {
    const groupMap = new Map<string, MarkerGroup>();
    for (const marker of allMarkers) {
        const uriStr = marker.resource.toString();
        if (!groupMap.has(uriStr)) {
            const path = marker.resource.path;
            const fileName = path.split('/').pop() || path;
            groupMap.set(uriStr, { uri: uriStr, fileName, markers: [] });
        }
        groupMap.get(uriStr)!.markers.push(marker);
    }
    const groups = Array.from(groupMap.values());
    groups.sort((a, b) => a.fileName.localeCompare(b.fileName));
    for (const group of groups) {
        group.markers.sort((a, b) => b.severity - a.severity || a.startLineNumber - b.startLineNumber);
    }
    return groups;
}

export default function Problems({ context: molecule }: { context: IMoleculeContext }) {
    const [markerGroups, setMarkerGroups] = useState<MarkerGroup[]>([]);
    const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

    useEffect(() => {
        const updateMarkers = () => {
            const allMarkers = editor.getModelMarkers({});
            const groups = buildMarkerGroups(allMarkers);
            setMarkerGroups(groups);

            const count = allMarkers.length;
            const baseName = molecule.locale.localize('panel.item.problems', 'Problems');
            molecule.panel.update({
                id: PANEL_ID,
                name: count > 0 ? `${baseName}(${count})` : baseName,
            });
        };

        updateMarkers();
        const disposable = editor.onDidChangeMarkers(() => {
            updateMarkers();
        });

        return () => disposable.dispose();
    }, [molecule]);

    const handleClickMarker = useCallback(
        (marker: editor.IMarker) => {
            const groups = molecule.editor.getGroups();
            for (const group of groups) {
                const tab = group.data.find((t) => t.model && t.model.uri.toString() === marker.resource.toString());
                if (tab) {
                    molecule.editor.setCurrent(tab.id, group.id);
                    queueMicrotask(() => {
                        const currentGroup = molecule.editor.getGroup(group.id);
                        const editorInstance = currentGroup?.editorInstance;
                        if (editorInstance) {
                            editorInstance.setPosition({
                                lineNumber: marker.startLineNumber,
                                column: marker.startColumn,
                            });
                            editorInstance.revealLineInCenter(marker.startLineNumber);
                            editorInstance.focus();
                        }
                    });
                    return;
                }
            }
        },
        [molecule]
    );

    const toggleFile = (uri: string) => {
        setCollapsedFiles((prev) => {
            const next = new Set(prev);
            if (next.has(uri)) next.delete(uri);
            else next.add(uri);
            return next;
        });
    };

    const totalCount = markerGroups.reduce((sum, g) => sum + g.markers.length, 0);

    if (totalCount === 0) {
        return (
            <div className="problems-panel problems-empty">
                {molecule.locale.localize('panel.problems.noProblems', 'No problems have been detected.')}
            </div>
        );
    }

    return (
        <div className="problems-panel">
            {markerGroups.map((group) => (
                <div key={group.uri}>
                    <div className="problems-file-header" onClick={() => toggleFile(group.uri)}>
                        <span
                            className={`codicon codicon-${collapsedFiles.has(group.uri) ? 'chevron-right' : 'chevron-down'}`}
                        />
                        <span className="codicon codicon-file" />
                        <span className="problems-file-name">{group.fileName}</span>
                        <span className="problems-file-count">{group.markers.length}</span>
                    </div>
                    {!collapsedFiles.has(group.uri) &&
                        group.markers.map((marker, idx) => (
                            <div key={`${group.uri}-${idx}`} className="problems-row" onClick={() => handleClickMarker(marker)}>
                                <span
                                    className={`codicon codicon-${getSeverityIcon(marker.severity)} ${getSeverityClass(marker.severity)}`}
                                />
                                <span className="problems-message">{marker.message}</span>
                                {marker.source && <span className="problems-source">{marker.source}</span>}
                                <span className="problems-location">
                                    [{marker.startLineNumber}:{marker.startColumn}]
                                </span>
                            </div>
                        ))}
                </div>
            ))}
        </div>
    );
}
