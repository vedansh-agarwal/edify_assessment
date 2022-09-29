DROP DATABASE IF EXISTS `tempdb`;
CREATE DATABASE `tempdb`;
USE `tempdb`;

CREATE TABLE `tempdb`.`customers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customerId` VARCHAR(200) NOT NULL,
  `customerName` VARCHAR(200) NOT NULL,
  `mobileNo` VARCHAR(40) NOT NULL UNIQUE,
  `companyName` VARCHAR(200) NOT NULL,
  `designation` VARCHAR(200) NULL,
  `companyEmailId` VARCHAR(100) NOT NULL UNIQUE,
  `country` VARCHAR(100) NULL,
  `createdOn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updatedOn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `surveyReportUrl` VARCHAR(200) NULL,
  `surveyStatus` VARCHAR(100) NOT NULL DEFAULT 'Pending',
  `registrationStatus` INT NOT NULL DEFAULT 0,
  `companyUrl` VARCHAR(200) DEFAULT NULL,
  `refreshToken` VARCHAR(300) DEFAULT NULL,
  PRIMARY KEY (`id`));
  
CREATE TABLE `tempdb`.`customer_otp` (
  `current_timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `email` VARCHAR(100) NOT NULL,
  `otp` VARCHAR(100) NOT NULL);

CREATE TABLE `tempdb`.`questions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sectionName` VARCHAR(200) NOT NULL,
  `subSectionName` VARCHAR(200) NULL,
  `questionDescription` TEXT NOT NULL,
  `choiceDetails` TEXT NOT NULL,
  `createdOn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `createdBy` VARCHAR(100) NOT NULL,
  `updatedOn` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updatedBy` VARCHAR(100) NOT NULL,
  `questionHelp` VARCHAR(500) NULL,
  PRIMARY KEY (`id`));
  
CREATE TABLE `tempdb`.`survey_answers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `customerId` VARCHAR(100) NOT NULL UNIQUE,
  `surveyAnswers` TEXT NOT NULL,
  `currentQuestion` INT NOT NULL DEFAULT 0,
  `surveyStartDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `surveyEndDate` DATETIME NULL,
  `surveyCompleteFlag` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`));

DELIMITER $$
USE `tempdb`$$
CREATE PROCEDURE `delete_expired_OTPs`()
BEGIN
	DELETE FROM `customer_otp` 
    WHERE CURRENT_TIMESTAMP() - `current_timestamp` > 1600;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `check_otp`(
IN `email_input` VARCHAR(100), 
IN `otp_input` VARCHAR(100), 
IN `customer_id_input` VARCHAR(200), 
IN `refresh_token_input` VARCHAR(300))
BEGIN
    SET @var1 = (SELECT `otp` FROM `customer_otp` WHERE `email` = `email_input` AND `otp` = `otp_input`);
    SET @user_id = customer_id_input;
    IF (NOT ISNULL(@var1)) THEN
		SET @var2 = (SELECT `companyEmailId` FROM `customers`  WHERE `companyEmailId` = `email_input`);
        IF(ISNULL(@var2)) THEN
			INSERT INTO `customers` (`customerId`, `customerName`, `mobileNo`, `companyName`, `companyEmailId`, `refreshToken`, `designation`, `country`, `companyUrl`) 
			VALUE (`customer_id_input`, "", UUID(), "", `email_input`, `refresh_token_input`, "", "", "");
		ELSE
			UPDATE `customers` SET `refreshToken` = `refresh_token_input` WHERE `companyEmailId` = `email_input`;
			SET @user_id = (SELECT `customerId` FROM `customers` WHERE `companyEmailId` = `email_input`);
        END IF;
        SELECT @user_id AS `customer_id`;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `insert_otp` (IN `email_input` VARCHAR(100), IN `otp_input` VARCHAR(100))
BEGIN
	INSERT INTO `customer_otp` (email, otp) VALUES (`email_input`, `otp_input`);
    SELECT COUNT(*) AS `noOfLinkedAccounts` FROM `customers` WHERE `companyEmailId` = `email_input`;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `enter_customer_details` (
IN `name_input` VARCHAR(200), 
IN `mob_no_input` VARCHAR(15), 
IN `company_name_input` VARCHAR(200), 
IN `designation_input` VARCHAR(200), 
IN `email_input` VARCHAR(100),
IN `country_input` VARCHAR(100),
IN `company_url_input` VARCHAR(200))
BEGIN
	SET @var1 = (SELECT `registrationStatus` FROM `customers` WHERE `companyEmailId` = `email_input`);
    IF(@var1 = 0) THEN
		UPDATE `customers` 
        SET `customerName` = `name_input`, 
			`companyName` = `company_name_input`, 
			`mobileNo` = `mob_no_input`, 
			`designation` = `designation_input`, 
			`country` = `country_input`, 
			`companyUrl` = `company_url_input`, 
			`registrationStatus` = 1,
            `createdOn` = CURRENT_TIMESTAMP(),
            `updatedOn` = CURRENT_TIMESTAMP()
		WHERE `companyEmailId` = `email_input`;
        SELECT 0 AS `completionStatus`;
	ELSE
		SELECT -1 AS `completionStatus`;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `update_customer_details` (
IN `name_input` VARCHAR(200), 
IN `mob_no_input` VARCHAR(15), 
IN `company_name_input` VARCHAR(200), 
IN `designation_input` VARCHAR(200), 
IN `email_input` VARCHAR(100),
IN `country_input` VARCHAR(100),
IN `company_url_input` VARCHAR(200))
BEGIN
	UPDATE `customers` 
        SET `customerName` = IFNULL(`name_input`, `customerName`), 
			`companyName` = IFNULL(`company_name_input`, `companyName`), 
			`mobileNo` = IFNULL(`mob_no_input`, `mobileNo`), 
			`designation` = IFNULL(`designation_input`, `designation`), 
			`country` = IFNULL(`country_input`, `country`), 
			`companyUrl` = IFNULL(`company_url_input`, `companyUrl`), 
            `updatedOn` = CURRENT_TIMESTAMP()
		WHERE `companyEmailId` = `email_input`;
        
END$$
DELIMITER ;

DELIMITER $$
CREATE PROCEDURE `add_question` (
	IN `sectionName_input` VARCHAR(200),
	IN `subSectionName_input` VARCHAR(200),
	IN `questionDescription_input` TEXT,
	IN `choiceDetails_input` TEXT,
	IN `createdBy_input` VARCHAR(100),
	IN `questionHelp_input` VARCHAR(500))
BEGIN
	INSERT INTO `questions` (
    `sectionName`, 
    `subSectionName`, 
    `questionDescription`, 
    `choiceDetails`, 
    `createdBy`, 
    `updatedBy`, 
    `questionHelp`)
    VALUE (
    `sectionName_input`, 
    `subSectionName_input`, 
    `questionDescription_input`, 
    `choiceDetails_input`, 
    `createdBy_input`, 
    `createdBy_input`, 
    `questionHelp_input`);
    SELECT `id` FROM `questions` 
    WHERE `questionDescription` = `questionDescription_input` 
    AND `choiceDetails` = `choiceDetails_input`;
END$$
DELIMITER ;

CREATE VIEW `get_customer_details` AS
SELECT 
`tempdb`.`customers`.`customerName` AS `customerName`,
`tempdb`.`customers`.`companyName` AS `companyName`,
`tempdb`.`customers`.`companyUrl` AS `companyUrl`,
`tempdb`.`customers`.`designation` AS `designation`,
`tempdb`.`customers`.`companyEmailId` AS `companyEmailId`,
`tempdb`.`customers`.`mobileNo` AS `mobileNo`,
`tempdb`.`customers`.`country` AS `country`
FROM `tempdb`.`customers`;