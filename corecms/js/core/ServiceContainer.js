// js/core/ServiceContainer.js

export default class ServiceContainer {

    constructor() {
        this.services = new Map();
    }

    register(name, service) {

        if (this.services.has(name)) {
            throw new Error(`O serviço "${name}" já está registrado.`);
        }

        this.services.set(name, service);

    }

    get(name) {

        return this.services.get(name);

    }

    async initAll() {

        for (const service of this.services.values()) {

            if (typeof service.init === "function") {
                await service.init();
            }

        }

    }

    async destroyAll() {

        for (const service of this.services.values()) {

            if (typeof service.destroy === "function") {
                await service.destroy();
            }

        }

    }

}
