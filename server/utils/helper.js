const tokenString = (length) => {
    return stringToHex(generateRandomToken(length));
}

const dateExpire =  () => {
    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    return expirationDate.toISOString();
}

const verifyExpiredDate = (date) => {
    const currentDate = new Date();
    const expirationDate = new Date(date);
    if (expirationDate < currentDate) {
       return false;
    } else {
       return true;
    }
}


const generateRandomToken = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }

    return token;
}

const stringToHex = (str) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
}



module.exports = {
    tokenString,
    dateExpire,
    verifyExpiredDate
}