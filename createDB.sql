DROP DATABASE IF EXISTS `tempdb`;
CREATE DATABASE `tempdb`;
USE `tempdb`;

CREATE TABLE `tempdb`.`customers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customerId` VARCHAR(200) NOT NULL,
  `customerName` VARCHAR(200) NOT NULL,
  `mobileNo` VARCHAR(15) NOT NULL UNIQUE,
  `companyName` VARCHAR(200) NOT NULL,
  `designation` VARCHAR(200) NULL,
  `companyEmailId` VARCHAR(100) NOT NULL,
  `country` VARCHAR(100) NULL,
  `createdOn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updatedOn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `surveyReportUrl` VARCHAR(200) NULL,
  `surveyStatus` VARCHAR(100) NOT NULL DEFAULT 'Pending',
  `registrationStatus` INT NOT NULL DEFAULT 0,
  `companyUrl` VARCHAR(200) DEFAULT NULL,
  PRIMARY KEY (`id`));
  
CREATE TABLE `tempdb`.`customer_otp` (
  `current_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `email` VARCHAR(100) NOT NULL,
  `otp` VARCHAR(100) NOT NULL);

DELIMITER $$
USE `tempdb`$$
CREATE PROCEDURE `delete_expired_OTPs` ()
BEGIN
	DELETE FROM `customer_otp` WHERE CURRENT_TIMESTAMP() - `current_timestamp` > 1500;
END$$
DELIMITER ;