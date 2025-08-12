export function __srtToVttBrowser(srt: string): string {
    let vtt = 'WEBVTT\n\n';
    vtt += srt
        .replace(/\r+/g, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/(\d+:\d+:\d+),(\d+)/g, '$1.$2');
    return vtt;
}
