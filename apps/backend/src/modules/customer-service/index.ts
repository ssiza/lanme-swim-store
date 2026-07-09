import { Module } from "@medusajs/framework/utils"
import CustomerServiceModuleService from "./service"

export const CUSTOMER_SERVICE_MODULE = "customer_service"

export default Module(CUSTOMER_SERVICE_MODULE, {
  service: CustomerServiceModuleService,
})
