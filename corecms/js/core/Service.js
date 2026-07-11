// js/core/Service.js

export default class Service {

    constructor(core) {
        this.core = core;
        this.initialized = false;
    }

    async init() {
        this.initialized = true;
    }

    async destroy() {
        this.initialized = false;
    }

}
