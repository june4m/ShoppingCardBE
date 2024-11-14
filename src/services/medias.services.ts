import { Request } from 'express'
import sharp from 'sharp'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { getNameFromFullNameFile, handleUploadImage, handleUploadVideo } from '~/utils/file'
import fs from 'fs'
import { MediaType } from '~/constants/enums'
import { Media } from '~/models/Other'
class MediasServices {
  async handleUploadImage(req: Request) {
    const files = await handleUploadImage(req) //thu hoạch file từ req
    // đặt tên mới cho file

    const result = await Promise.all(
      //rất nhiều tác vụ cùng chạy trong 1 thời điểm vì async nên phải bọc vào promise all
      files.map(async (file) => {
        const newFileName = getNameFromFullNameFile(file.newFilename) + '.jpg'
        const newPath = UPLOAD_IMAGE_DIR + '/' + newFileName
        // optimize bức hình
        const infor = await sharp(file.filepath).jpeg().toFile(newPath)

        fs.unlinkSync(file.filepath) //xóa file tạp
        //cung cấp route link để người dùng vào xem hình vừa up
        return {
          url: `http://localhost:3000/static/image/${newFileName}`,
          type: MediaType.Image
        } as Media
      })
    )
    return result
  }

  async handleUploadVideo(req: Request) {
    const files = await handleUploadVideo(req) //thu hoạch file từ req
    // đặt tên mới cho file

    const result = await Promise.all(
      //rất nhiều tác vụ cùng chạy trong 1 thời điểm vì async nên phải bọc vào promise all
      files.map(async (file) => {
        const newFileName = file.newFilename
        const newPath = UPLOAD_VIDEO_DIR + '/' + newFileName
        //cung cấp route link để người dùng vào xem hình vừa up
        return {
          url: `http://localhost:3000/static/video/${newFileName}`,
          type: MediaType.Video
        } as Media
      })
    )
    return result
  }
}

const mediasServices = new MediasServices()
export default mediasServices
