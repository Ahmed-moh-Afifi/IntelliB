class Utils {
    static async publicIp() {
        let res = await fetch('https://api.ipify.org?format=json')
        return (await res.json()).ip
    }
}

module.exports = Utils