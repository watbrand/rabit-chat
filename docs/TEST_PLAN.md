# RabitChat Test Plan

## Overview
This document outlines the testing procedures for validating bug fixes and core functionality in RabitChat.

---

## Test Environment

- **Platform:** iOS, Android (Expo Go), Web
- **Screen Size:** 400x720 (mobile portrait)
- **Backend:** Express.js on port 5000
- **Frontend:** Expo on port 8081

---

## Test Cases

### TC-001: Follow Back Button
**Preconditions:** Two users exist where User B follows User A

**Steps:**
1. Log in as User A
2. Navigate to User B's profile
3. Observe the follow button

**Expected Result:** Button displays "Follow Back" if User B follows User A

---

### TC-002: Notification Deep Linking (LIKE)
**Preconditions:** User A has liked User B's post, notification exists

**Steps:**
1. Log in as User B
2. Navigate to Activity tab
3. Tap on the like notification

**Expected Result:** Navigates to PostDetail screen showing the liked post

---

### TC-003: Notification Deep Linking (COMMENT)
**Preconditions:** User A has commented on User B's post

**Steps:**
1. Log in as User B
2. Navigate to Activity tab
3. Tap on the comment notification

**Expected Result:** Navigates to PostDetail screen showing the commented post

---

### TC-004: Notification Deep Linking (FOLLOW)
**Preconditions:** User A has followed User B

**Steps:**
1. Log in as User B
2. Navigate to Activity tab
3. Tap on the follow notification

**Expected Result:** Navigates to User A's profile

---

### TC-005: Notification Deep Linking (MESSAGE)
**Preconditions:** User A has sent a message to User B

**Steps:**
1. Log in as User B
2. Navigate to Activity tab
3. Tap on the message notification

**Expected Result:** Navigates to Chat screen with User A

---

### TC-006: Mark All Notifications as Read
**Preconditions:** User has multiple unread notifications

**Steps:**
1. Navigate to Activity tab
2. Observe "Mark all as read" button at top of list
3. Tap the button

**Expected Result:** All notifications marked as read, button disappears

---

### TC-007: Notification Panel Layout
**Steps:**
1. Navigate to Activity tab with notifications present
2. Scroll through notification list

**Expected Result:** 
- No content hidden behind header
- Proper spacing and padding
- Smooth scrolling with mark all button in header

---

### TC-008: Large Video Upload
**Preconditions:** Video file up to 500MB

**Steps:**
1. Create new post
2. Select VIDEO type
3. Upload large video file (100MB+)
4. Submit post

**Expected Result:** Upload succeeds, post created

---

### TC-009: Create Post FAB Position
**Steps:**
1. Navigate to main tab screen
2. Observe FAB position

**Expected Result:** FAB positioned in bottom-left corner

---

### TC-010: Admin Reports - Suspend User
**Preconditions:** Admin user, pending report exists

**Steps:**
1. Log in as admin
2. Navigate to Settings → Admin → Reports
3. Select a report
4. Choose "Suspend User" action
5. Enter suspension reason
6. Confirm

**Expected Result:** User suspended, action logged

---

### TC-011: Image Viewer Modal
**Preconditions:** Post with image exists

**Steps:**
1. Navigate to profile with image posts
2. Tap on image to open viewer
3. Pinch to zoom in/out
4. Double-tap to toggle zoom
5. Tap X to close

**Expected Result:**
- Image displays full-screen
- Zoom gestures work
- Close button dismisses modal

---

### TC-012: Profile Cover Photo Viewer
**Preconditions:** User has cover photo set

**Steps:**
1. Navigate to profile with cover photo
2. Tap on cover photo
3. Verify image viewer opens

**Expected Result:** Cover photo opens in ImageViewerModal

---

## Regression Tests

### RT-001: User Authentication
- Login with valid credentials
- Logout functionality
- Session persistence

### RT-002: Post Creation
- Text post creation
- Photo post with image
- Video post with thumbnail
- Voice post with audio

### RT-003: Social Interactions
- Like/unlike posts
- Comment on posts
- Follow/unfollow users
- Save/unsave posts
- Share posts

### RT-004: Messaging
- Send text messages
- Real-time message delivery (WebSocket)
- Conversation list updates

### RT-005: Profile Management
- Edit display name
- Update bio
- Change avatar
- Update cover photo
- Privacy settings

---

## Performance Tests

### PT-001: Feed Loading
- Initial feed load < 2 seconds
- Infinite scroll pagination works
- Pull-to-refresh updates content

### PT-002: Image Loading
- Images load progressively
- Cached images load instantly
- Large images don't crash app

---

## Error Handling Tests

### EH-001: Network Errors
- Graceful offline handling
- Retry mechanisms work
- Error messages display correctly

### EH-002: Invalid Input
- Form validation works
- Error feedback shown to user
- Prevents invalid submissions

---

## Accessibility Tests

### AT-001: TestIDs Present
- Interactive elements have testID props
- Format follows convention: `{action}-{target}`

### AT-002: Touch Targets
- Minimum 44x44pt touch targets
- Adequate spacing between elements

---

## Notes

- All tests should be run on both iOS and Android via Expo Go
- Web testing provides additional coverage but may differ from native
- Use production-like data for realistic testing scenarios
