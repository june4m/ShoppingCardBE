import { Collection, Db, MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
dotenv.config() //kết nối với file .env
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@shoppingcardcluster.0p9yh.mongodb.net/?retryWrites=true&w=majority&appName=shoppingCardCluster`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
class DatabaseServices {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }
  //acessor property
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USERS_COLLECTION as string) //chơi database  nguy hiểm nên cần phải rờ chuột
    //return this.db.collection(`${process.env.DB_USERS_COLLECTION as string}`) không được gõ như này vì nếu cái chuỗi này bị undifine thì nó sẽ tạo ra 1 cái bug lớn
  }

  get refresh_tokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
  }
}
//tạo bẩn thể instance
const databaseServices = new DatabaseServices()
export default databaseServices
