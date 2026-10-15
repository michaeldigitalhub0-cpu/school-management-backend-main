const TZ = 'Africa/Lagos';

exports.getCurrentDay = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
};

exports.getCurrentTime = () => {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(new Date());
};

exports.getCurrentDayName = () => {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        weekday: 'long',
    }).format(new Date()).toLowerCase();
};