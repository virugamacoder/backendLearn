import { Router } from "express";
import {
  CreateProposal,
  jobsContractor,
  singupContractor,
    uploadCompanyBusinessCard,
  GetContractDetails,
  CreateContract,
  Login
} from "../controllers/condo.controllers.js";

import { upload } from "./../middlewares/multer.middlewares.js";
import { createCityArea, createDesignation, getCityArea, getDesignation } from "../controllers/cpadmin.controllers.js";

const router = Router();

router
  .route("/contractor/upload-business-card")
  .post(upload.single("companyBusinessCard"), uploadCompanyBusinessCard);

 
router.route("/contractor").post(singupContractor);

router.route("/login").post(Login);

router.route("/contractor/contracts").get(jobsContractor);

router.route("/contractor/contract").post(CreateContract);
router.route("/contractor/contract/:id").get(GetContractDetails);



router.route("/proposal").post(CreateProposal);



// admin routes
router.route("/designation").post(createDesignation);
router.route("/designation").get(getDesignation);

router.route("/cityarea").post(createCityArea);
router.route("/cityarea").get(getCityArea);


export default router;
