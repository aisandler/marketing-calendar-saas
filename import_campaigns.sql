-- Import campaigns from the tradeshow calendar (March 10th, 2025 onward)

-- First, let's clear any existing data to avoid duplicates
DELETE FROM public.campaigns WHERE start_date >= '2025-03-10';

-- Insert tradeshow campaigns
INSERT INTO public.campaigns (name, campaign_type, start_date, end_date, location, description, created_at, updated_at)
VALUES
  -- Tradeshows (SHOW ATT)
  ('CANNACON MINNESOTA', 'tradeshow', '2025-08-11', '2025-08-13', 'Minnesota', 'CANNACON MINNESOTA tradeshow', NOW(), NOW()),
  ('HAMPTONS CANNABIS EXPO', 'tradeshow', '2025-08-18', '2025-08-18', 'Hamptons', 'HAMPTONS CANNABIS EXPO (DATE TBD)', NOW(), NOW()),
  ('MJBiz', 'tradeshow', '2025-09-01', '2025-09-06', 'NJ', 'NECANN NJ', NOW(), NOW()),
  ('HALL OF FLOWERS', 'tradeshow', '2025-09-29', '2025-09-29', NULL, 'HALL OF FLOWERS', NOW(), NOW()),
  ('NECANN CT', 'tradeshow', '2025-10-06', '2025-10-06', 'Connecticut', 'NECANN CT (DATE TBD)', NOW(), NOW()),
  ('COLUMBUS OHIO', 'tradeshow', '2025-10-13', '2025-10-17', 'Ohio', 'COLUMBUS OHIO (DATE TBD)', NOW(), NOW()),
  ('MJ UNPACKED', 'tradeshow', '2025-11-03', '2025-11-03', 'St. Louis', 'MJ UNPACKED ST LOUIS', NOW(), NOW()),
  ('CANNABIS CUP', 'tradeshow', '2025-11-17', '2025-11-17', NULL, 'CANNABIS CUP - LI CANNABIS COALITION', NOW(), NOW()),
  ('MJ BIZ', 'tradeshow', '2025-12-08', '2025-12-08', NULL, 'MJ BIZ', NOW(), NOW()),
  ('WWD RETAIL SUMMIT', 'tradeshow', '2025-12-15', '2025-12-15', NULL, 'WWD Retail Summit', NOW(), NOW()),
  
  -- Other events (EVENT)
  ('ASD MARKET SHOW', 'event', '2025-08-25', '2025-08-25', NULL, 'ASD MARKET SHOW', NOW(), NOW()),
  ('WOMEN IN CANNABIS', 'event', '2025-09-01', '2025-09-01', NULL, 'Women in Cannabis Dinner Sponsorship $800', NOW(), NOW()),
  ('BIZ INTERNATIONAL DESIGN AWARD', 'event', '2025-10-20', '2025-10-20', NULL, 'BIZ International Design Award event sponsor', NOW(), NOW()),
  ('STUDIO 5 STUDENT TOUR', 'event', '2025-10-27', '2025-10-27', NULL, 'STUDIO 5 STUDENT TOUR', NOW(), NOW()),
  ('PAVE GALA', 'event', '2025-12-08', '2025-12-08', NULL, 'PAVE GALA', NOW(), NOW()),
  ('STUDIO X PAVE', 'event', '2025-12-08', '2025-12-08', NULL, 'STUDIO X - PAVE PIN/ PANEL DISCUSSION/ CENTENNIAL CELEBRATION FOR ALL BRANDS', NOW(), NOW()),
  
  -- Events we host (EVENT WE HOST)
  ('BIZ Sip Into Summer', 'event', '2025-07-28', '2025-07-28', NULL, 'BIZ Sip Into Summer', NOW(), NOW()),
  ('STUDIO 5 CENTENNIAL INDUSTRY PARTY', 'event', '2025-10-06', '2025-10-06', NULL, 'STUDIO 5 - CENTENNIAL INDUSTRY PARTY!', NOW(), NOW());

-- Insert digital campaigns for print media
INSERT INTO public.campaigns (name, campaign_type, start_date, end_date, location, description, created_at, updated_at)
VALUES
  -- Print Media Campaigns
  ('MG Retail - July', 'digital_campaign', '2025-07-01', '2025-07-31', NULL, 'Double Truck, 2PG + Design Showcase', NOW(), NOW()),
  ('MG Retail - August', 'digital_campaign', '2025-08-01', '2025-08-31', NULL, 'Double Truck, 2PG + Design Showcase', NOW(), NOW()),
  ('MG Retail - September', 'digital_campaign', '2025-09-01', '2025-09-30', NULL, 'Double Truck, 2PG + Design Showcase', NOW(), NOW()),
  ('MG Retail - October', 'digital_campaign', '2025-10-01', '2025-10-31', NULL, 'Double Truck, 2PG + Design Showcase', NOW(), NOW()),
  ('MG Retail - November', 'digital_campaign', '2025-11-01', '2025-11-30', NULL, 'Double Truck, 2PG + Design Showcase', NOW(), NOW()),
  ('MG Retail - December', 'digital_campaign', '2025-12-01', '2025-12-31', NULL, 'Double Truck, 2PG + Design Showcase', NOW(), NOW()),
  
  -- Digital Media Campaigns
  ('Digital Media - July', 'digital_campaign', '2025-07-01', '2025-07-31', NULL, 'Video Banner/ Right Square/ E-Newsletter Ad', NOW(), NOW()),
  ('Digital Media - August', 'digital_campaign', '2025-08-01', '2025-08-31', NULL, 'Video Banner/ Right Square/ E-Newsletter Ad', NOW(), NOW()),
  ('Digital Media - September', 'digital_campaign', '2025-09-01', '2025-09-30', NULL, 'Video Banner/ Right Square/ E-Newsletter Ad', NOW(), NOW()),
  ('Digital Media - October', 'digital_campaign', '2025-10-01', '2025-10-31', NULL, 'Video Banner/ Right Square/ E-Newsletter Ad', NOW(), NOW()),
  ('Digital Media - November', 'digital_campaign', '2025-11-01', '2025-11-30', NULL, 'Video Banner/ Right Square/ E-Newsletter Ad', NOW(), NOW()),
  ('Digital Media - December', 'digital_campaign', '2025-12-01', '2025-12-31', NULL, 'Video Banner/ Right Square/ E-Newsletter Ad', NOW(), NOW()),
  
  -- MONDO Tag/SELLUTIONS Tag Campaigns
  ('MONDO July/August', 'digital_campaign', '2025-07-01', '2025-08-31', NULL, 'MONDO - July/ August', NOW(), NOW()),
  ('MONDO Tag/SELLUTIONS Tag - July', 'digital_campaign', '2025-07-28', '2025-07-28', NULL, 'MONDO Tag/SELLUTIONS Tag', NOW(), NOW()),
  ('MONDO Sept/Oct', 'digital_campaign', '2025-09-22', '2025-10-31', NULL, 'MONDO - Sept/ Oct', NOW(), NOW()),
  ('MONDO Tag/SELLUTIONS Tag - September', 'digital_campaign', '2025-09-29', '2025-09-29', NULL, 'MONDO Tag/SELLUTIONS Tag', NOW(), NOW()),
  ('MONDO Nov/Dec', 'digital_campaign', '2025-11-01', '2025-12-31', NULL, 'MONDO - Nov/ Dec', NOW(), NOW()),
  ('MONDO Tag/SELLUTIONS Tag - November', 'digital_campaign', '2025-11-03', '2025-11-03', NULL, 'MONDO Tag/SELLUTIONS Tag', NOW(), NOW());

-- Insert seasonal campaigns
INSERT INTO public.campaigns (name, campaign_type, start_date, end_date, location, description, created_at, updated_at)
VALUES
  ('SHOWROOM REFRESH - Q3', 'seasonal_promotion', '2025-07-01', '2025-09-30', NULL, 'SHOWROOM REFRESH - DISPLAY DISPENSARY OR CENTENNIAL', NOW(), NOW()),
  ('SHOWROOM REFRESH - Q4', 'seasonal_promotion', '2025-10-01', '2025-12-31', NULL, 'SHOWROOM REFRESH - DISPLAY DISPENSARY FOR MJ BIZ & CENTENNIAL', NOW(), NOW()); 