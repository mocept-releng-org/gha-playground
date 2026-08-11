export function parseVersion(v: string): {major: number, minor: number, patch: number} {
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(v);
    if (!match) throw new Error(`bump-version: invalid version "${v}"`);
    const [, major, minor, patch] = match;
    return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

export function bump(v: string, type: 'major' | 'minor' | 'patch'): string {
    const version = parseVersion(v);
    if (type === 'major') {
        version.major += 1;
        version.minor = 0;
        version.patch = 0;
    } else if (type === 'minor') {
        version.minor += 1;
        version.patch = 0;
    } else if (type === 'patch') {
        version.patch += 1;
    } else {
        throw new Error(`bump-version: invalid bump type "${type}"`);
    }
    return `v${version.major}.${version.minor}.${version.patch}`;
}