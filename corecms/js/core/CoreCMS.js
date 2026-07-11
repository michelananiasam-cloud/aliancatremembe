import config from "../../config/config.js";
import ServiceContainer from "./ServiceContainer.js";

export default class CoreCMS {

    constructor() {

        this.config = config;

        this.services = new ServiceContainer();

        this.startedAt = null;

    }

    async start() {

        this.startedAt = performance.now();

        console.log(`🚀 ${this.config.appName} v${this.config.version}`);

        this.initializeDocument();

        await this.services.initAll();

        this.renderHome();

        window.app = this;

        const elapsed = (performance.now() - this.startedAt).toFixed(2);

        console.log(`✅ Sistema iniciado em ${elapsed} ms`);

    }

    initializeDocument() {

        document.title = `${this.config.appName} ${this.config.version}`;

        document.body.dataset.app = this.config.appName;
        document.body.dataset.version = this.config.version;
        document.body.dataset.theme = this.config.theme;

    }

    renderHome() {

        document.getElementById("app").innerHTML = `

            <section>

                <h1>${this.config.appName}</h1>

                <p>Versão ${this.config.version}</p>

                <p>Sistema iniciado com sucesso.</p>

            </section>

        `;

    }

}
