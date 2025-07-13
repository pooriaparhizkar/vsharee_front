export function _secondToTime(value: number) {
    const second = value % 60;
    const minute = Math.floor(value / 60);
    return `${minute >= 10 ? minute : '0' + minute}:${second >= 10 ? second : '0' + second}`;
}
