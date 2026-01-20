# TikTok OAuth Integration - Product and Scope Description

## About Zablink Platform

**Zablink** is a local business directory and discovery platform that connects local shops and businesses with consumers in Thailand. Our platform enables users to discover nearby shops, restaurants, and services through location-based search, while providing businesses with tools to showcase their offerings and connect with local customers.

---

## Product Overview

### Core Product: Local Business Discovery Platform

**Zablink** is a web-based marketplace and directory platform that serves multiple user types:

1. **Regular Users** - Discover and explore local businesses
2. **Shop Owners** - Register and manage business profiles
3. **Content Creators/Reviewers** - Create reviews and content for businesses
4. **Administrators** - Manage platform operations

---

## TikTok OAuth Integration Purpose

We integrate TikTok Login to provide users with a convenient and secure authentication option. TikTok OAuth allows users to:

- **Quick Sign-In**: Users can create accounts or log in using their TikTok credentials, eliminating the need to create separate passwords
- **Profile Import**: Automatically import basic profile information (display name, avatar) to streamline account creation
- **Enhanced User Experience**: Provide a familiar authentication method for users who prefer social login options

---

## TikTok OAuth Scope Usage

### Scope Requested: `user.info.basic`

We request the **`user.info.basic`** scope to access the following information:

#### 1. **User Identification**
- **Open ID**: Used as a unique identifier to link the TikTok account with the user's Zablink account
- **Purpose**: Ensures users can securely log in and maintain their account association

#### 2. **Display Name**
- **Display Name**: The user's public TikTok username or display name
- **Purpose**: 
  - Pre-fill the user's profile name during registration
  - Display the user's name in their Zablink profile
  - Show the user's name when they create reviews or interact with shops

#### 3. **Avatar URL**
- **Avatar/Profile Picture**: The user's TikTok profile picture URL
- **Purpose**:
  - Set as the default profile picture in the user's Zablink account
  - Display the avatar throughout the platform (in reviews, comments, user profiles)
  - Personalize the user experience

---

## How Each Product Feature Works with TikTok Login

### 1. **User Registration & Authentication**
- **Feature**: Account creation and login
- **TikTok Integration**: 
  - Users click "Sign in with TikTok" button
  - Redirected to TikTok authorization page
  - After consent, user information (Open ID, display name, avatar) is retrieved
  - Zablink creates or updates user account with this information
  - User is authenticated and redirected back to Zablink

### 2. **User Profile Management**
- **Feature**: User profile pages showing name, avatar, and activity
- **TikTok Data Usage**:
  - Display name appears in user profile header
  - Avatar image is shown as profile picture
  - Users can update this information later if desired

### 3. **Shop Reviews & Content Creation**
- **Feature**: Users can create reviews for local businesses
- **TikTok Data Usage**:
  - User's display name and avatar appear on reviews they create
  - Other users can identify who created each review
  - Enhances credibility and social proof for shop owners

### 4. **Creator/Reviewer Application**
- **Feature**: Users can apply to become verified content creators
- **TikTok Integration**:
  - TikTok login provides an additional verification layer
  - Profile information helps establish creator identity
  - Display name and avatar are used in creator profiles

### 5. **Social Interactions**
- **Feature**: Bookmarking shops, following businesses, community engagement
- **TikTok Data Usage**:
  - User identity (name, avatar) appears in activity feeds
  - Enhances social connectivity and trust within the platform

### 6. **Shop Registration**
- **Feature**: Business owners can register their shops
- **TikTok Integration**:
  - Shop owners can use TikTok login to create their business accounts
  - Personal information helps verify shop ownership
  - Avatar and name appear in shop owner dashboard

---

## Data Usage & Privacy

### Data Collection
- We only collect the minimum information required for authentication: Open ID, Display Name, and Avatar URL
- No additional TikTok data is accessed or stored

### Data Storage
- User information is stored securely in our database
- Open ID is used to maintain the authentication link
- Display name and avatar are stored as part of the user profile

### Data Usage
- User information is used exclusively within the Zablink platform
- We do not share TikTok user data with third parties
- Users can update or remove their TikTok-linked account at any time

---

## User Consent & Control

- Users must explicitly consent to sharing their TikTok information
- Users can see exactly what information we request during the OAuth flow
- Users can disconnect their TikTok account from Zablink at any time through account settings
- All data usage complies with our Privacy Policy and Terms of Use

---

## Technical Implementation

### OAuth Flow
1. User clicks "Sign in with TikTok" on Zablink
2. User is redirected to TikTok authorization page
3. User grants permission for `user.info.basic` scope
4. TikTok redirects back to Zablink with authorization code
5. Zablink exchanges code for access token
6. Zablink retrieves user info (Open ID, display name, avatar URL)
7. User account is created/updated in Zablink database
8. User session is established

### API Endpoints Used
- Authorization: `https://www.tiktok.com/v2/auth/authorize/`
- Token Exchange: `https://open.tiktokapis.com/v2/oauth/token/`
- User Info: `https://open.tiktokapis.com/v2/user/info/` (with `user.info.basic` scope)

---

## Security & Compliance

- **CSRF Protection**: State parameter is used to prevent cross-site request forgery
- **Secure Storage**: All tokens and user data are stored securely
- **HTTPS Only**: All OAuth communications use HTTPS
- **Token Expiration**: Access tokens are properly managed and refreshed
- **Privacy Compliance**: All data handling complies with applicable data protection regulations

---

## Summary

Zablink uses TikTok Login with the `user.info.basic` scope to provide a seamless authentication experience for users discovering local businesses. The basic user information (Open ID, display name, and avatar) is used exclusively to create and maintain user accounts within our platform, enhancing user experience while maintaining privacy and security standards.
