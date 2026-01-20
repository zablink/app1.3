# TikTok OAuth - Short Description for Application Form

## Product Description

**Zablink** is a local business directory and discovery platform connecting local shops and businesses with consumers in Thailand. Users can discover nearby restaurants, shops, and services through location-based search, while businesses can showcase their offerings and connect with customers.

---

## How TikTok Login is Used

We integrate TikTok Login to provide users with convenient authentication. Users can sign up or log in using their TikTok credentials instead of creating separate passwords.

---

## Scope Usage: `user.info.basic`

We request the **`user.info.basic`** scope to access:

1. **Open ID** - Used as unique identifier to link TikTok account with Zablink user account
2. **Display Name** - Used to pre-fill and display the user's name in their Zablink profile and reviews
3. **Avatar URL** - Used to set the user's profile picture throughout the platform

---

## How Each Product Works with TikTok Login

### 1. User Authentication
- Users click "Sign in with TikTok" to create or access their Zablink account
- TikTok user information (Open ID, display name, avatar) is used to create/update the Zablink user profile

### 2. User Profiles
- Display name and avatar from TikTok are shown in the user's Zablink profile
- This information appears when users create reviews, bookmark shops, or interact with businesses

### 3. Content Creation
- Users can create reviews for local businesses
- Their TikTok display name and avatar appear on reviews they publish, adding credibility

### 4. Shop Registration
- Business owners can use TikTok login to register and manage their shop accounts
- Profile information helps verify shop ownership

### 5. Creator Applications
- Users applying to become verified content creators can use TikTok login for additional identity verification

---

## Data Usage

- **Collection**: We only collect Open ID, Display Name, and Avatar URL
- **Storage**: Information is stored securely in our database for account management
- **Usage**: Data is used exclusively within Zablink platform for user identification and profile display
- **Sharing**: We do not share TikTok user data with third parties
- **User Control**: Users can disconnect their TikTok account at any time

---

## Summary

Zablink uses TikTok Login with `user.info.basic` scope to enable seamless user authentication. The basic user information is used exclusively to create user accounts, display profiles, and identify users within our local business discovery platform, enhancing user experience while maintaining privacy standards.
