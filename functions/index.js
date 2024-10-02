/**
 * Copyright 2023 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//import {initializeApp} from "firebase-admin/app";
const {initializeApp} = require("firebase-admin/app");
//import {getDatabase} from "firebase-admin/database";
const {getDatabase} = require("firebase-admin/database");
//import {getMessaging} from "firebase-admin/messaging";
const {getMessaging} = require("firebase-admin/messaging");
//import {log, warn} from "firebase-functions/logger";
const {log, warn} = require("firebase-functions/logger");
//import {onValueWritten} from "firebase-functions/v2/database";
const {onValueWritten} = require("firebase-functions/v2/database");

initializeApp();
const db = getDatabase();
const messaging = getMessaging();

/**
 * Triggers when a user gets a new follower and sends a notification. Followers
 * add a flag to `/followers/{followedUid}/{followerUid}`. Users save their
 * device notification tokens to
 * `/users/{followedUid}/notificationTokens/{notificationToken}`.
 */
exports.onWrittenFunctionDefault = onValueWritten(
    {
        ref: "/stats/{stat}",
        region: "asia-southeast1"
    },
    async (event) => {
      const ref = event.data.after.val();
      const dept = ref.dept;
      const isPush = ref.isPush;
      //log('MSG', dept, isPush);
      // If not push we exit the function.
      if (!ref.isPush) {
        log(`MSG ${event.params.stat} is not for PUSH`);
        return;
      }

      // Notification details.
      const notification = {
        title : 'DB System Notification',
        body : ref.subject + '  - ' + ref.name,
        //sound : 'default'   //iOS only?
        //image: followerProfile.photoURL ?? "",
      };

      const uidsRef = db.ref(`/noti/${ref.dept}`);
      const uids = await uidsRef.get();
      //log('uids:', uids.val());
      if (!uids.hasChildren()) {
        log(`There are no tokens in dept ${ref.dept} to send notifications to.`);
        return;
      }
      log(`There are ${uids.numChildren()} tokens in dept ${ref.dept}`);

      // Send notifications to all tokens.
      const messages = [];
      uids.forEach((child) => {
        log(`uid: ${child.key}, ${child.val().token}`);
        messages.push({
          //token: uids[child.key]['token'],
          token: child.val().token,
          notification: notification
        });
      });

      /*
          // Apple specific settings
          apns: {
              headers: {
                  'apns-priority': '10',
              },
              payload: {
                  aps: {
                      sound: 'default',
                  }
              },
          },
          android: {
            priority: 'high',
            notification: {
                sound: 'default',
            }
          }
      */

      const batchResponse = await messaging.sendEach(messages);

      if (batchResponse.failureCount < 1) {
        // Messages sent sucessfully. We're done!
        log("Messages sent.");
        return;
      }
      warn(`${batchResponse.failureCount} messages weren't sent.`,
          batchResponse);

    });
