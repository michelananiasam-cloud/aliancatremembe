// js/core/ServiceContainer.js

export default class ServiceContainer {

    constructor() {
        this.services = new Map();
    }

    /**
     * Registra um serviço no container.
     * @param {string} name
     * @param {object} instance
     */
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

    /**
     * Retorna a instância de um serviço.
     * @param {string} name
     * @returns {object|null}
     */
    get(name) {

        const service = this.services.get(name);

        return service ? service.instance : null;

    }

    /**
     * Inicializa todos os serviços registrados.
     */
    async initAll() {

        for (const service of this.services.values()) {

            service.status = "starting";
            service.startedAt = performance.now();

            if (typeof service.instance.init === "function") {
                await service.instance.init();
            }

            service.finishedAt = performance.now();

            // Guarda o valor real (sem arredondar)
            service.duration = service.finishedAt - service.startedAt;

            service.status = "running";
            service.initialized = true;

        }

    }

    /**
     * Finaliza todos os serviços registrados.
     */
    async destroyAll() {

        for (const service of this.services.values()) {

            if (typeof service.instance.destroy === "function") {
                await service.instance.destroy();
            }

            service.status = "stopped";
            service.initialized = false;

        }

    }

    /**
     * Lista os serviços para exibição.
     * @returns {Array}
     */
    list() {

        return [...this.services.values()].map(service => ({

            name: service.name,

            status: service.status,

            initialized: service.initialized,

            duration: service.duration !== null
                ? Number(service.duration.toFixed(2))
                : null

        }));

    }

}
