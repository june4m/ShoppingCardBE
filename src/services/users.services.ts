import User from '~/models/schemas/User.schema'
import databaseServices from './database.services'

class UsersServices {
  async regiser(payload: { email: string; password: string }) {
    const { email, password } = payload
    const result = await databaseServices.users.insertOne(
      new User({
        email,
        password
      })
    )
    return result
  }
}

//tạo instance
const usersServices = new UsersServices()
export default usersServices
