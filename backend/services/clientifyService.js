    // services/clientifyService.js
    const axios = require("axios");

    const CLIENTIFY_API_URL = "https://api.clientify.net/v1/contacts/";
    const CLIENTIFY_API_TOKEN = process.env.CLIENTIFY_API_TOKEN;

    /**
     * Envía un referido a Clientify
     * @param {Object} referido - Información del referido
     * @param {string} embajadorNombre - Nombre completo del embajador
     */
    async function enviarAClientify(referido, embajadorNombre) {
    try {
        const payload = {
        first_name: referido.nombres, // ✅ viene del front
        last_name: referido.apellidos, // ✅ viene del front
        email: referido.correo_electronico, // ✅ mapeado desde front
        phone: referido.numero_telefonico, // ✅ mapeado desde front
        description: `Referido por embajador: ${embajadorNombre}`,
        tags: [`Embajador: ${embajadorNombre}`],
        };
        console.log("📤 Enviando a Clientify:", payload);

        const response = await axios.post(CLIENTIFY_API_URL, payload, {
        headers: {
            Authorization: `Token ${CLIENTIFY_API_TOKEN}`,
            "Content-Type": "application/json",
        },
        });

        console.log("✅ Referido enviado a Clientify:", response.data);
        return response.data;
    } catch (error) {
        console.error(
        "❌ Error al enviar a Clientify:",
        error.response?.data || error.message
        );
        throw new Error("Error al enviar a Clientify");
    }
    }

    module.exports = { enviarAClientify };
