// js/core/ServiceContainer.js

export default class ServiceContainer {

    constructor() {
        this.services = new Map();
    }

    register(name, instance) {

        if (this.services.has(name)) {
            throw new Error(`O serviço "${name}" já está registrado.`);
        }

        this.services.set(name, {
            name,
            instance,
            status: "registered",
            initialized: false,
            startedAt: null,
            finishedAt: null,
            duration: null
        });

    }

    get(name) {

        const service = this.services.get(name);

        return service ? service.instance : null;

    }

    async initAll() {

        for (const service of this.services.values()) {

            service.status = "starting";
            service.startedAt = performance.now();

            if (typeof service.instance.init === "function") {
                await service.instance.init();
            }

            service.finishedAt = performance.now();

            service.duration =
                +(service.finishedAt - service.startedAt).toFixed(2);

            service.status = "running";
            service.initialized = true;

        }

    }

    async destroyAll() {

        for (const service of this.services.values()) {

            if (typeof service.instance.destroy === "function") {
                await service.instance.destroy();
            }

            service.status = "stopped";
            service.initialized = false;

        }

    }

    list() {

        return [...this.services.values()].map(service => ({

            name: service.name,

            status: service.status,

            initialized: service.initialized,

            duration: service.duration

        }));

    }

}
