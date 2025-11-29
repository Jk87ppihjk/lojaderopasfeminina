const { User } = require('./db');
const bcrypt = require('bcryptjs');

const createAdmin = async () => {
    try {
        const email = 'tutano172@gmail.com';
        const password = 'tutano172@gmail.com';
        const name = 'Admin Master';

        // Verifica se já existe
        const adminExists = await User.findOne({ where: { email: email } });

        if (adminExists) {
            console.log("✅ Admin já existe no banco de dados.");
        } else {
            // Se não existir, cria
            const hashedPassword = await bcrypt.hash(password, 10);
            
            await User.create({
                name: name,
                email: email,
                password: hashedPassword,
                isAdmin: true, // Garante poderes de ADM
                cpf: '00000000000' // CPF fictício se for obrigatório
            });

            console.log("🚀 Admin criado com sucesso!");
            console.log("📧 Email: " + email);
            console.log("🔑 Senha: " + password);
        }
    } catch (error) {
        console.error("❌ Erro ao criar Admin:", error.message);
    }
};

module.exports = createAdmin;
