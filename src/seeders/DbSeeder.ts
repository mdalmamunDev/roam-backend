import { BalanceService } from "../modules/balance/balance.service";
import SettingSeeder from "../modules/settings/settings.seeder";
import { User } from "../modules/user/user.model";

const adminSeeder = async () => {
    const existingUser = await User.findOne({ email: 'bryman00008@gmail.com' });
    if (!existingUser) {
        await User.create({
            name: 'Mr. Admin',
            email: 'bryman00008@gmail.com',
            phone: '0123456789',
            address: 'New York',
            role: 'admin',
            isEmailVerified: true,
            password: "1qazxsw2"
        });
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }

}


const balanceSeeder = async () => {
    BalanceService.addAppBalance(0);
    BalanceService.addChargeBalance(0);
}

const DbSeeder = async () => {
    try {
        await Promise.all([
            adminSeeder(),
            SettingSeeder(),
            balanceSeeder(),
        ]);
    } catch (error) {
        console.error('Error seeding:', error);
    }
}

export default DbSeeder;