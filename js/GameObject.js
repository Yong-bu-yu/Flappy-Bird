export class GameObject {

    name = ''
    size = new GameObjectSize()
    point = new GameObjectPoint()
    imagesSrc = new Array()
    #images = new Array()
    #oldTime = Date.now()
    #nowTime
    #index = 0
    isShow = true
    canvas
    elCanvas
    component = new Array()

    constructor(name) {
        this.name = name
        GameObjectManager.gameObjects.push(this)
    }

    async getComponent() {
        if (this.imagesSrc.length != 0) {
            await this.#setSize()
            await this.getImages()
            return this
        }
        console.error(('没有图片'));
    }

    async #setSize() {
        for (let index = 0; index < this.imagesSrc.length; index++) {
            let img = new Image()
            img.src = this.imagesSrc[index]
            let image = await this.#loadImageAsync(img)
            this.size.width = image.width
            this.size.height = image.height
            if (this.#images.length != this.imagesSrc.length)
                this.#images.push(img)
        }
    }

    async #loadImageAsync(img) {
        return new Promise(function (res, rej) {
            img.onload = function () {
                res(img)
            }
        })
    }

    async getImages() {
        return this.#images
    }

    async #Image() {
        this.#nowTime = Date.now()
        let time = this.#nowTime - this.#oldTime
        time *= GameObjectManager.time
        if (time > 100) {
            this.#oldTime = Date.now()
            if (this.#index >= this.imagesSrc.length)
                this.#index = 0
            ++this.#index
        }
        if (this.imagesSrc.length - 1 == 0)
            return await this.#images[0]
        return await this.#images[Math.abs(this.#index - 1)]
    }

    async #drawImage(image, x, y, width, height) {
        if (this.canvas == undefined)
            console.error("没有画布");
        this.canvas.drawImage(image, x, y, width, height)
    }

    async Draw(x, y) {
        if (this.isShow) {
            let img = await this.#Image()
            if (x != undefined && y != undefined) {
                this.point.x = x, this.point.y = y
                await this.#drawImage(img, x, y, this.size.width, this.size.height)
            }
            else
                await this.#drawImage(img, this.point.x, this.point.y, this.size.width, this.size.height)
        }
    }

    async addComponent(component) {
        this.component.push(component)
    }
}

class GameObjectSize {
    width = 0;
    height = 0;
}

class GameObjectPoint {
    x = 0
    y = 0
}

export class GameObjectCollider2D extends GameObject {
    isTrigger = false
    offset = this.point
    size = this.size
    sizeOfpoint
    onTriggerEnter = Function()
    onTriggerStay = Function()

    constructor(gameObject) {
        super(gameObject.name)
        let that = this;
        (async function update() {
            that.size = gameObject.size
            that.point = gameObject.point
            that.offset = gameObject.point
            that.elCanvas = gameObject.elCanvas
            that.isShow = gameObject.isShow
            that.sizeOfpoint = {
                x1: that.offset.x,
                x2: that.offset.x + that.size.width,
                y1: that.offset.y,
                y2: that.offset.y + that.size.height
            }
            if (!(that instanceof GameObjectButton)) {
                if (that.isShow && that.isTrigger) {
                    let _2d = await that.#getCollider2D();
                    for (let index = 0; index < _2d.length; index++) {
                        // if ((that.sizeOfpoint.x2 >= _2d[index].sizeOfpoint.x1) &&
                        //     (that.sizeOfpoint.y1 >= _2d[index].sizeOfpoint.y1) &&
                        //     (that.sizeOfpoint.x1 <= _2d[index].sizeOfpoint.x2) &&
                        //     (that.sizeOfpoint.y2 <= _2d[index].sizeOfpoint.y2)) {
                        //     that.onTriggerStay(_2d[index])
                        //     // return
                        // }
                        if (!((that.sizeOfpoint.x2 < _2d[index].sizeOfpoint.x1) ||
                            (that.sizeOfpoint.y1 < _2d[index].sizeOfpoint.y1) ||
                            (that.sizeOfpoint.x1 > _2d[index].sizeOfpoint.x2) ||
                            (that.sizeOfpoint.y2 > _2d[index].sizeOfpoint.y2))) {
                            that.onTriggerStay(_2d[index])
                            // return
                        }
                    }
                }
            }
            requestAnimationFrame(update)
        })()
    }

    async #getCollider2D() {
        let arr = GameObjectManager.gameObjects.filter((value, index, array) => {
            if (!(value instanceof GameObjectButton))
                if (value instanceof GameObjectCollider2D)
                    if (value.name != this.name) {
                        return value
                    }
        })
        return arr
    }
}

export class GameObjectButton extends GameObjectCollider2D {
    click = Function()
    constructor(gameObject) {
        super(gameObject)
        this.isTrigger = true;
        let that = this;
        (async function update() {
            if (that.elCanvas == undefined)
                return
            that.elCanvas.addEventListener('click', event => {
                let offsetX = event.offsetX, offsetY = event.offsetY
                if ((offsetX >= that.sizeOfpoint.x1 && offsetX <= that.sizeOfpoint.x2) &&
                    (offsetY >= that.sizeOfpoint.y1 && offsetY <= that.sizeOfpoint.y2))
                    if (that.isShow)
                        that.click(event)
            });
            requestAnimationFrame(update)
        })()
    }
}

export class GameObjectManager {
    static gameObjects = new Array()
    static time = 1
}

export class GameObjectRigidBody2D extends GameObject {

    velocity = new GameObjectPoint()
    G = 9.8
    m = 1
    h = 210
    g
    #oldTime = Date.now()

    constructor(gameObject) {
        super(gameObject.name)
        let that = this;
        (async function update() {
            let nowTime = Date.now()
            let time = nowTime - that.#oldTime;
            time *= GameObjectManager.time
            if (gameObject.isShow) {
                that.G *= that.m
                that.g = that.G / ((1000 / time) * 2)
                that.point = gameObject.point
                that.point.y = that.h + that.g * that.m
                that.h = that.point.y
            }
            requestAnimationFrame(update)
        })()
    }

    async addForce() {
        this.#oldTime = Date.now()
        this.G = -9.8
        this.h -= 30
        if (this.h <= 0)
            this.h = 0
    }
}