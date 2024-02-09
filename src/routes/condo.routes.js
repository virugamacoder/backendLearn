import { Router } from "express";
import {
    registerContractor,uploadCompanyBusinessCard
} from "../controllers/condo.controllers.js";

import { upload } from "./../middlewares/multer.middlewares.js";


const router = Router();

router.route("/contractor/upload-business-card").post(
    upload.single("companyBusinessCard"),
    uploadCompanyBusinessCard
);

router.route("/contractor/register").post(
    registerContractor
);


export default router;
