import * as http from 'http'
import * as async from 'async'
import { URL } from 'url';

interface Order {
    a: number,
    p: number,
    t: number
}
interface Entrusted {
    s: string,
    a: number,
    p: number,
    t: number,
    b: boolean
}

class Market {
    stock: string
    buy : Array<Order>
    sale : Array<Order>

    market = async.queue((task:Entrusted,callback)=>{
        this.entrustStock(task)
        this.sortEntrust()
        callback()
    },1)
    constructor(stock:string)
    {
        this.stock = stock
        this.buy = Array<Order>()
        this.sale = Array<Order>()
    }

    entrustStock (entrusted:Entrusted) {
        if (entrusted.b == true) {
            //买盘
            if (this.sale.length > 0 && entrusted.p >= this.sale[0].p) {
                // 购买价高于等于抛盘
                while (entrusted.a > 0 && entrusted.p >= this.sale[0].p) {
                    if (entrusted.a >= this.sale[0].a) {
                        entrusted.a -= this.sale[0].a
                        let log = this.sale.shift()
                        console.log(`deal: ${log!.a} at ${log!.p}`)
                        if (this.sale.length == 0) {
                            break
                        }
                    } else {
                        this.sale[0].a -= entrusted.a
                        console.log(`deal: ${entrusted.a} at ${this.sale[0].p}`)
                        entrusted.a = 0
                    }
                }
            }
            if (entrusted.a > 0) {
                this.buy.push(entrusted)
                console.log(`eb: ${entrusted.a} at ${entrusted.p}`)
            }
        } else {
            //卖盘
            if (this.buy.length > 0 && entrusted.p <= this.buy[0].p) {
                // 卖出价低于等于买盘
                while (entrusted.a > 0 && entrusted.p <= this.buy[0].p) {
                    if (entrusted.a >= this.buy[0].a) {
                        entrusted.a -= this.buy[0].a
                        let log = this.buy.shift()
                        console.log(`deal: ${log!.a} at ${log!.p}`)
                        if (this.buy.length == 0) {
                            break
                        }
                    } else {
                        this.buy[0].a -= entrusted.a
                        console.log(`deal: ${entrusted.a} at ${this.buy[0].p}`)
                        entrusted.a = 0
                    }
                }
            }
            if (entrusted.a > 0) {
                this.sale.push(entrusted)
                console.log(`es: ${entrusted.a} at ${entrusted.p}`)
            }
        }
    }
    sortEntrust(){
        this.buy = this.buy.sort((first, second) => {
            let d = first.p - second.p
            return d == 0 ? first.t - second.t : second.p - first.p
        })
        this.sale = this.sale.sort((first, second) => {
            let d = first.p - second.p
            return d == 0 ? first.t - second.t : first.p - second.p
        })
    }
}

let stocks = [new Market('600001'), new Market('600002')]

let server = http.createServer((req, res)=>{
    let p = req.url!.split('/')
    if (p[1].toLowerCase() == 'l') {
        for (const it of stocks) {
            let data = {n:it.stock, b: it.buy, s: it.sale }
            res.write(JSON.stringify(data))
        }
        res.end()
    }
    let entrusted: Entrusted = { s: p[2], a: Number(p[3]), p: Number(p[4]), t: new Date().getTime(), b: true}
    if (p[1].toLowerCase() == 'b') {
        entrusted.b = true
        stocks[stocks.findIndex((v,i,o)=>{return v.stock == entrusted.s})].market.push(entrusted)
    } else if (p[1].toLowerCase() == 's'){
        entrusted.b = false
        stocks[stocks.findIndex((v, i, o) => { return v.stock == entrusted.s })].market.push(entrusted)
    }
    res.end()
})

server.listen(8000)