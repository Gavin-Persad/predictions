# Project Plan

1. Reverted back to manual fixture entry until i find a free api or build a webscraper. ✅

2. Test this is working. Both ways✅

3. Create Edit Game Week component, with manual entry✅

4. Again test this all works✅

5. Create View game week options component✅

6. Create Game week options individual components (view fixtures, view MOTW). These will need to be linked to Supabase for data✅

7. Test everything is working and linked to Supabase correctly✅

8. Update ReadMe✅

9. Create enter scores functionality✅

10. Test enter scores functionality✅

---

## bugs

- back to seasons buttons show under hamburger icon, need to be moved down so they are seperate.✅
- admin page needs centering✅
- responsive design repairs:
- Predictions form elements over lap✅
- fix enter scores and view seasons to not have left margin✅
- Fix enterscores form and display to have cancel and back buttons.✅
- View seasons, (view players, Edit players, View game week, create/edit game week. All not fitting in box).✅
- View game week, game weeks are to vertical need to be more horizontal.✅
- in game week view, (View Scores and View manager of the week not fitting in the box)✅
- in create/edit game week (create game week and edit game week not fitting in box)✅
- the create game week form is too thin and crushes elements.✅
- in edit game week, game weeks are too vertical and not horizontal✅
- the edit game week form is too thin and crushes elements.✅
-
- create season modal confirmation screen needed✅
- view scores modal in view seasons can now be updated to collect scores from supabase predictions table✅

---

11. add edit score entries section for hosts.

- create enter correct scores button for host.✅
- create enter scores form and link to supabase fixtures table✅
- add correct scores to scores modal✅

12. Create scoring league table view and add this where desired (dashboard) and view seasons

    - create player game week score table on supabase (game_week_id, player_id, corectscores, points)✅
    - create player season score table on supabase (season_id, player_id, corectscores, points)✅
    - create functionality to update the game_week_scores(This will need to be done from a logic place, when the host updates scores) This will then update the season score table as well. (This can be done from adding the points and correct scores in the game week score table)✅
    - add view table button to view season✅
    - create league table that pulls and sorts from player scores ( try to make this sortable by position, name, correct scores and points)✅

13. Test scoring and table works✅

14. Add in cup competitions, rules and format✅

- george cup✅
- navigating rounds doesn't change the round view, still showing previous round fixtures. ✅\*\* now working but not showing blank fixtures.
- edit rounds not working, could this be because the round has been completed. Need to test this by creating a new game week.\*\* now games confirmation is not working. Nothing being created on supabase.✅
- game weeks can still be changed after confirmed, this needs to be locked in.✅
- rounds not being counted and next round goes forever.\*\* now working when you arrive at the page, but not working when you have created fixtures, also further rounds still showing first rounds fixtures.✅
- submit is not working when editing a cup round.✅
- first round fixtures are showing in the right hand column in all rounds( when a new round has been selected by using the arrows on the header.)✅
- ensure that once fixtures have been selected that they are in place when returning to this screen.✅
- Working on passing winners through to next round⌛currently working on getting winner determination working✅

- create view cup❌
- tree format as the rounds are created, shows scores from that game week.❌

15. Make it so that scores do not show unitl the live fixtures start✅

16. rebuild the cups from the start. We can now have fixtures picked by computer.✅

17. build edit george cup page✅

- get players and rounds showing✅
- get fixture selection working✅
- No duplicate rows in george_cup_rounds table✅
- Players persist after page refresh✅
- Draw functionality creates fixtures✅
- Players names and scores display correctly✅
  \*\*game week id is blank on george_cup_fixtures table once game week has been selected. this isn't needed as the game week is logged on the george_cup_rounds table as well.✅
- Fix winner/loser color highlighting, Debug winner/loser class ✅
- application in fixture display, Verify winner_id is being set correctly✅
- get players to start with 0-0 predictions until they have changed predictions.✅
- round progression working just needs display fix
- lock new rounds drop down menu until required amount of players are ready.
- update logic to handle drawing scenarios✅ This has caused flickering on a coin toss, need to fix
  Suggested fix: 1. Generate the random selection once 2. Store that result 3. Use that same result consistently✅
- Implement round progression, Create function to check for round winners on page load, Add logic to progress winners to next round when all fixtures complete, Update database and UI to reflect progressed players✅ This is working, but there is an issue with the new fixture flickering until there has been a refresh. ⌛
- check progression to final and overall winner.✅
- lock drop down menu on future rounds until players have been decided for this round✅
- add styles where needed ( each column is individually scroll able when population flows over screen, players names have a line through them when knocked out in the players column)✅

18. Create view george cup component✅

- winners column✅
- highlight me✅
- moved the back button on editGeorgeCup as well✅

19. create lavery cup

- Create base page and link to view seasons✅
- create round creation and link to game week✅
- edit enterscores form to add lavery cup selection and link to supabase✅
- edit predictions display to also show lavery cup selection✅
- update enter scores to allow for lavery cup markings. Add second page if there is a lavery cup. This page will have the teams that have been selected, host will need to tick the winners. Then submit. The modal will then show the two pages, first the correct scores, when you hit confirm you will then see the second page of the modal, the lavery cup selections and markings. When you hit confirm on this we will then update the supabase as already set we will also now update the lavery_cup_rounds table is_complete and update the lavery_cup_selections table team1_won and team2_won on supabase.✅
- lavery cup issues✅
- modal flow not working - opening modal on page 2, buttons are not taking you to the correct places.
- update leagues button issues✅
- if team is not selected then boolean should be updated to false on lavery_cup_selection table.✅
- if both booleans are true then should also update the advanced column on lavery_cup_selection table✅
- check round progression to winner✅
- check reset lavery cup function⏳

20. view lavery cup✅

- Create base page and link to view seasons✅
- create view lavery cup component✅
- have in rounds, similar to the george cup with scrollable columns and player list which is checked off✅
- show selections only after live start✅
- mark selections as correct or incorrect once scores are in.✅

- my predictions, an entered form says elminated on lavery cup before host has entered scores, this should say waiting on results.✅
- george cup doesn't show winners or player vs player games until next round is drawn, winners should show as soon as there are points in place.
- one round complete and one player shows as winner, winner should only show when one player is left and all others eliminated. Once a second round it added, the winners column is removed.⏳
- players not being checked off on the players list when eliminated.
- SCORE BREAKDOWN NOT SHOWING ON CLOSED ENTERSCORES CARDS

1. Lavery Cup Prediction Status Fix✅
   Issue: Players see "Eliminated" status before host enters scores
   Fix: Change status to "Waiting on results" when team1_won/team2_won are null
   Location: PredictionsDisplay component
2. Lavery Cup Winner Column Logic⏳
   Issue: Winner column appears too early and disappears when second round is added
   Fix: Only show winner column when all rounds are complete AND only one player remains
   Location: ViewLaveryCup component, within the IIFE that renders the winner column
3. Lavery Cup Player Elimination Visual Indication
   Issue: Players aren't visually marked as eliminated in the player list
   Fix: Add strike-through or visual indicator for eliminated players
   Location: Player list in ViewLaveryCup component
4. EnterScores Score Breakdown Display
   Issue: Score breakdown not showing on closed EnterScores cards
   Fix: Ensure breakdown appears correctly after scores submitted
   Location: EnterScores component or related display components
5. George Cup Winners Display
   Issue: Winners don't show until next round is drawn
   Fix: Update winners as soon as points are in place
   Location: ViewGeorgeCup component, winner determination logic

- no winners show reset coming warning⏳

21. Test cups and format⏳

22. Make Dashboard

- add functionality to dashboard - indiviual squares containting different components, when clicked these will take you to the links, they will show on the dashboard page with the below views.

  Content(

enter scores

- link - link to enter scores page
- dashboard view - coniditon of most recent game week. game week is the week that open for predictions time has passed most recently

  24/25 season League

- link - takes you to viewseasons, with the current season props
- dashbaord view - top 6 of the table showing, your place showing if not in top 6 and only top 5 show

  24/25 season George Cup

- link - takes you to view george cup page, with current season props
- dashbaord view - shows your current fixtures and round, if you have been knocked out this will show the current round and underneath say the round you were knocked out on: For Example "George Cup Semi Finals - Live 09/05/25. You were knocked out in the 2nd Round"

messages

- link - messages page, list of measages that host has posted, add, edit and delete message button for hosts only. Host can also pin and unpin messages.
- dashboard view, shows pin message by host.
- Also add this to side bar menu.

rules

- link - rules page, rules listed.
- dashboard view - just a title no need for anything live.
- Also add this to side bar menu.

chat

- link - chat page
- dashboard view - last few messages
- in side bar add a link to new page
- basic chat page where users can leave messages
- if possible, most recent message you read is whrre you rejoin

  )

23. Desired features

- add colour coding to scores modal✅
- correct all page titles and button titles and labels.✅
- my predictions, needs better titles, (game week, live start, predictions open and close)✅
- view game week, change to (title: game week, sub: as is live open to close )✅
- edit game week, change to (title: game week, sub: as is live open to close )✅
- enter scores, change to (title: game week, sub: as is live open to close )✅
- history page, seasons winners cup winners etc. needs supabase table updated by other areas(individual comps)
- add season name as title to view seasons page
  about me
- small page, add to side menu, that has information about me and the project, git hub links etc. Also add this to side bar menu.
- edit lavery cup - add players list that checks off as players go out, like cups first columns

23. Bugs

- page flickers and needs refresh when draw second round of cup. Loop issue in the perform draw function.This rerendering is causing lots of rest api calls this could become a big issue.
- add loading... to view seasons page when fetching seasons.
- check routing to ensure that players who are logged in, get redirected from log in to the dashboard.
- errors showing in console when going to my pedictions, enter scores page due to adding lavery cup selections
- view george cup - scroll bar for columns is just off bottom of the page

24. Test thoroughly with 1 player and 1 host

25. Prepare for beta testing

26. Update ReadMe and announce on LinkedIn

27. Receive feedback and fix bugs/make improvements
