Here's the document rewritten in Markdown:

# Delays

![Verified naming](label-green)

Delays are what is commonly referred to as locks or stalls. It is a mechanic deployed by NPCs and players alike to fully block the execution of most scripts and prevent almost all input from players.

## Table of Contents
- [Known Delays](#known-delays)
    - [Arrive Delay](#arrive-delay)
        - [Uses](#uses)
    - [Normal Delay](#normal-delay)
        - [Uses](#uses-1)
- [System Impacts](#system-impacts)
- [Media](#media)
- [References](#references)

## Known Delays

There are currently two types of delays known, both of which apply to players and NPCs. When delays are called from within scripts, they also pause the script itself.

### Arrive Delay

Arrive delays are used to delay the entity for one server tick if they moved in this or the last server tick. Arrive delays are **not** used to wait until the entity arrives at the destination location.[^2] That is instead done by putting the [normal delay](#normal-delay) in a loop. The commands OldSchool RuneScape uses for arrive delays are `p_arrivedelay` and `npc_arrivedelay` for players and NPCs respectively.[^1]

#### Uses

Arrive delays are often used to properly synchronize animations up with movement. An example of this can be seen when mining a rock. If you stand one game square away from the rock, then click to mine it, your character will get delayed for one server tick on the tick that you arrive by the rock. Any input you provide during that one server tick is completely ignored, as your character will be under the effects of a delay. Although rather rare, arrive delays can also be used when interacting with NPCs, as one such example can be seen when using a [poisoned tofu](https://oldschool.runescape.wiki/w/Poisoned_tofu) on a [penance healer](https://oldschool.runescape.wiki/w/Penance_Healer).

### Normal Delay

Normal delays are used to pause scripts from executing for a specified period of time, while also preventing any interruptions from other sources, such as a player's own input. Normal delays require the duration in server ticks to be passed as an argument to the command itself. It is not possible to conditionally use delays, although it is possible to chain multiple normal delay calls together, with the code you wish to execute in between those delays.[^1] The commands OldSchool RuneScape uses for normal delays are `p_delay` and `npc_delay` for players and NPCs respectively.

#### Uses

Normal delays are widely used around the game. Some uses are mentioned below:

* Teleportation
* Cutscenes
* Death
* Agility shortcuts and obstacles

## System Impacts

This section of the document explains how delays impact other core systems of OldSchool RuneScape. Below are the core systems, and descriptions on how delays impact them:

* **Timers:**
    * While timers continue to tick down, they will pause once the timer reaches 0, until the delay ends. It is unable to execute the script behind the timer itself while a delay exists.

* **Entity interactions:**
    * While a delay is active, entity interactions do not get processed.

* **Interface interactions:**
    * Interface clicks do go through, although it is up to the individual script behind a button to determine whether the effects of clicking it will go through or be ignored while under the effects of a delay.
    * An example of a button click going through while delayed is changing music in the music player. It will allow the player to change music just fine.
    * An example of a button click **not** going through while delayed is unequipping gear. The click is simply ignored altogether.

* **Queues:**
    * While a delay is active, queues do not get processed.

* **Route events:**
    * While route events do not get processed under delays, existing pre-determined(prior to the delay) movement will still continue to process.

## Media

*Below is a gif of the rock mining arrive delay taking effect. During that one specific tick upon arriving by a rock, your character is under the effects of a delay, meaning normal interruptions such as walking away do not get processed.*

[Mining arrive delay example]

*Below is a gif of a normal [Falador teleport](https://oldschool.runescape.wiki/w/Falador_Teleport), which happens to cause a three tick delay.*

[Teleport delay example]

*Mod Ash providing insight to their delays system.*

[Mod Ash tweets]

*Mod Ash explaining arrive delays only lasting one server tick, and mentioning the existence of npc_arrivedelay.*

[Arrive delay clarification]

## References

[^1]: [Mod Ash' tweets on delays](https://twitter.com/ZenKris21/status/1431228469124403200)
[^2]: [Mod Ash' tweets on arrive delays specifically](https://twitter.com/ZenKris21/status/1431945368929984512)

---

*Copyright © 2021-2022 Kris. Distributed by an [MIT license](https://github.com/Z-Kris/osrs-docs/blob/master/LICENSE).*

[Edit this page on GitHub](https://github.com/Z-Kris/osrs-docs/tree/master/docs/mechanics/delays.md)
