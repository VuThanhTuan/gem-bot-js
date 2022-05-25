function union(sets) {
    return sets.reduce((combined, list) => {
        return new Set([...combined, ...list]);
    }, new Set());
}

class GridDistinction {
    removedGems = [];
    matchesSize = [];
}
class Grid {
    constructor(gemsCode, gemModifiers, gemTypes, enemyGemTypes, botPlayer, enemyPlayer) {
        this.gems = [];
        this.gemeCode = gemsCode;
        this.gemTypes = new Set();
        this.updateGems(gemsCode, gemModifiers);

        this.myHeroGemType = gemTypes;
        this.enemyGemTypes = enemyGemTypes;

        this.botPlayer = botPlayer;
        this.enemyPlayer = enemyPlayer;
    }

    updateGems(gemsCode, gemModifiers) {
        this.gems = [];
        this.gemeCode = gemsCode;
        this.gemTypes = new Set();

        for (let i = 0; i < gemsCode.size(); i++) {
            let gem = new Gem(i, gemsCode.getByte(i), gemModifiers != null ? gemModifiers.getByte(i) : GemModifier.NONE);
            this.gems.push(gem);

            this.gemTypes.add(gem.type);

            // console.log(i + ": " + gem.type)
        }
    }

    getMaxGemMatch(listMatchGem) {
        const max = Math.max(...listMatchGem.map(o => o.sizeMatch));
        return listMatchGem.find(x => x.sizeMatch == max);
    }

    recommendSwapGem() {
        let listMatchGem = this.suggestMatch();

        console.log("recommendSwapGem: ", listMatchGem);



        if (listMatchGem.length === 0) {
            return [-1, -1];
        }

        try {
            // ưu tiên ăn kiếm nếu đủ giết tướng đầu tiên và tướng đầu tiên là chủ lực (bò || sói || thunder)
            const listAllMatchSword = listMatchGem.filter(gemMatch => gemMatch.type == GemType.SWORD);
            const myFirstHero = this.botPlayer.firstHeroAlive();
            const enemyFirstHero = this.enemyPlayer.firstHeroAlive();
            if (listAllMatchSword.length > 0
                && enemyFirstHero.shouldbeKillByDam(myFirstHero)) {
                console.log("11111111111");
                let matchGemSword = this.getMaxGemMatch(listAllMatchSword)
                if (matchGemSword) {
                    return matchGemSword.getIndexSwapGem();
                }
            }

            // ưu tiên match size 5 || 4 nếu include gem of hero hoặc enemy
            let matchGemSizeThanFourAll = listMatchGem.filter(gemMatch => gemMatch.sizeMatch >= 4);
            if (matchGemSizeThanFourAll.length
                && (matchGemSizeThanFourAll.filter(x => Array.from(this.myHeroGemType).includes(x.type))
                    || matchGemSizeThanFourAll.filter(x => Array.from(this.enemyGemTypes).includes(x.type)))) {
                console.log("22222222222");
                let matMyheroGem = matchGemSizeThanFourAll.find(x => Array.from(this.myHeroGemType).includes(x.type));
                let maxMatchGemSword = this.getMaxGemMatch(matchGemSizeThanFourAll);
                if (matMyheroGem) {
                    return matMyheroGem.getIndexSwapGem();
                }
                else {
                    return maxMatchGemSword.getIndexSwapGem();
                }
            }

            // todo ưu tiên ăn nhiều nhất có thể

            /// Gem of heroes ưu tiên ăn gem tướng buff giai đoạn đầu tướng chủ lực giai đoạn sau
            console.log("myHeroGemType: ", this.myHeroGemType, "| Array.from(this.myHeroGemType)", Array.from(this.myHeroGemType));
            let allmatchGemType = listMatchGem.filter(gemMatch => Array.from(this.myHeroGemType).includes(gemMatch.type));
            console.log("matchGemAll: ", allmatchGemType);
            const BF_HERO_ID = "MONK";
            const DM_HERO_ID_1 = "CERBERUS";
            const DM_HERO_ID_2 = "FIRE_SPIRIT";
            if (allmatchGemType.length) {
                console.log("33333333333");
                let matchGemType = allmatchGemType[0];
                const allHeroAlive = this.botPlayer.getHerosAlive();
                console.log('allmatchGemType', allmatchGemType);
                const buffHero = allHeroAlive.find(x => x.id == BF_HERO_ID);
                const dmHero1 = allHeroAlive.find(x => x.id == DM_HERO_ID_1);
                const dmHero2 = allHeroAlive.find(x => x.id == DM_HERO_ID_2);

                const buffHeroGemType = buffHero && buffHero.gemTypes.map(x => GemType[x]);
                let allDameGemTypes = [];
                if (dmHero1) {
                    allDameGemTypes = [...dmHero1.gemTypes];
                }
                if (dmHero2) {
                    allDameGemTypes = [...allDameGemTypes, ...dmHero2.gemTypes];
                }

                allDameGemTypes = allDameGemTypes.map(x => GemType[x]);
                console.log('buffHero', buffHero);
                if (buffHero && ((dmHero1 && dmHero1.attack < 15) || (dmHero2 && dmHero2.attack < 15))
                    // Tướng buff còn sống khỏe
                    && !(buffHero.hp <= 10 && this.enemyPlayer.hasHeroFullManaAndCanKill())) {
                    // ăn ngọc buff
                    console.log('ăn ngọc buff', matchGemType);
                    const matchGemTypeTemp = allmatchGemType.find(x => buffHeroGemType.includes(x.type));
                    if (matchGemTypeTemp) {
                        matchGemType = matchGemTypeTemp;
                    }
                } else if ((dmHero1 && dmHero1.attack > 15) || (dmHero2 && dmHero2.attack > 15)) {
                    // ăn ngọc dame
                    // cả 2 tướng dame còn sống ưu tiên ăn cho tướng nhiều mana hơn
                    let hightPriorityHero;
                    if (dmHero1 && dmHero2) {
                        if (dmHero1.mana >= 4 || dmHero1.mana > dmHero2.mana) {
                            hightPriorityHero = dmHero1;
                        }
                        else {
                            hightPriorityHero = dmHero2;
                        }
                    }
                    let matchGemTypeTemp;
                    if (hightPriorityHero) {
                        matchGemTypeTemp = allmatchGemType.find(x => hightPriorityHero.gemTypes.map(x => GemType[x]).includes(x.type));
                    }
                    else {
                        matchGemTypeTemp = allmatchGemType.find(x => allDameGemTypes.includes(x.type));
                    }

                    
                    if (matchGemTypeTemp) {
                        matchGemType = matchGemTypeTemp;
                    }
                    console.log('ăn ngọc dame', matchGemType);
                } else {
                    matchGemType = allmatchGemType[0];
                }

                return matchGemType.getIndexSwapGem();
            }
            ///

            // ưu tiên match size 5
            if (matchGemSizeThanFourAll.length) {
                console.log("44444444444444");
                let matchGemSword = this.getMaxGemMatch(matchGemSizeThanFourAll);
                if (matchGemSword) {
                    return matchGemSword.getIndexSwapGem();
                }
            }

            // ưu tiên ăn kiếm
            let matchGemSword = this.getMaxGemMatch(listAllMatchSword);
            if (matchGemSword) {
                console.log("55555555555");
                return matchGemSword.getIndexSwapGem();
            }

            //ưu tiên match size 4
            let matchGemSizeThanThree = listMatchGem.find(gemMatch => gemMatch.sizeMatch > 3);

            if (matchGemSizeThanThree) {
                console.log("666666666666");
                return matchGemSizeThanThree.getIndexSwapGem();
            }
            console.log("7777");
            console.log("listMatchGem[0].getIndexSwapGem() ", listMatchGem[0].getIndexSwapGem());

            return listMatchGem[0].getIndexSwapGem();
        } catch (ex) {
            console.error("exxx", ex);
            const matchGem = listMatchGem.find(gemMatch => Array.from(this.myHeroGemType).includes(gemMatch.type) || gemMatch.type == 0);
            return matchGem ? matchGem.getIndexSwapGem() : listMatchGem[0].getIndexSwapGem();
        }
    }

    suggestMatch() {
        let listMatchGem = [];

        const tempGems = [...this.gems];

        tempGems.forEach(currentGem => {

            let swapGem = null;
            // If x > 0 => swap left & check

            // console.log("currentGem : ", currentGem);
            if (currentGem.x > 0) {

                swapGem = this.gems[this.getGemIndexAt(parseInt(currentGem.x - 1), parseInt(currentGem.y))];

                this.checkMatchSwapGem(listMatchGem, currentGem, swapGem);
            }
            // If x < 7 => swap right & check
            if (currentGem.x < 7) {

                swapGem = this.gems[this.getGemIndexAt(parseInt(currentGem.x + 1), parseInt(currentGem.y))];

                this.checkMatchSwapGem(listMatchGem, currentGem, swapGem);
            }
            // If y < 7 => swap up & check
            if (currentGem.y < 7) {

                swapGem = this.gems[this.getGemIndexAt(parseInt(currentGem.x), parseInt(currentGem.y + 1))];

                this.checkMatchSwapGem(listMatchGem, currentGem, swapGem);
            }
            // If y > 0 => swap down & check
            if (currentGem.y > 0) {

                swapGem = this.gems[this.getGemIndexAt(parseInt(currentGem.x), parseInt(currentGem.y - 1))];

                this.checkMatchSwapGem(listMatchGem, currentGem, swapGem);
            }
        })
        return listMatchGem;
    }

    checkMatchSwapGem(listMatchGem, currentGem, swapGem) {

        if (currentGem.locked || swapGem.locked) {
            return;
        }

        this.swap(currentGem, swapGem);

        let matchGems = this.matchesAt(parseInt(currentGem.x), parseInt(currentGem.y));

        this.swap(currentGem, swapGem);


        if (matchGems.size > 0) {
            listMatchGem.push(new GemSwapInfo(currentGem.index, swapGem.index, matchGems.size, currentGem.type));
        }
    }

    getGemIndexAt(x, y) {
        return x + y * 8;
    }

    swap(a, b) {
        let tempIndex = a.index;
        let tempX = a.x;
        let tempY = a.y;

        // update reference
        this.gems[a.index] = b;
        this.gems[b.index] = a;

        // update data of element
        a.index = b.index;
        a.x = b.x;
        a.y = b.y;

        b.index = tempIndex;
        b.x = tempX;
        b.y = tempY;
    }

    swapIndex(index1, index2) {
        const gem1 = this.gems[index1];
        const gem2 = this.gems[index2];
        return this.swap(gem1, gem2);
    }

    matchesAt(x, y) {
        let res = new Set();

        let center = this.gemAt(x, y);

        if (center.type === -1 || center.removed || center.locked) {
            return res;
        }

        if (center === undefined) {

            console.error("gem center undefined");
            return res;
        }

        // check horizontally
        let hor = [];
        hor.push(center);
        let xLeft = x - 1, xRight = x + 1;
        while (xLeft >= 0) {
            let gemLeft = this.gemAt(xLeft, y);
            if (gemLeft) {
                if (!gemLeft.sameType(center)) {
                    break;
                }
                hor.push(gemLeft);
            }
            xLeft--;
        }
        while (xRight < 8) {
            let gemRight = this.gemAt(xRight, y);
            if (gemRight) {
                if (!gemRight.sameType(center)) {
                    break;
                }
                hor.push(gemRight);
            }
            xRight++;
        }
        if (hor.length >= 3) hor.forEach(gem => res.add(gem));

        // check vertically
        let ver = [];
        ver.push(center);
        let yBelow = y - 1, yAbove = y + 1;
        while (yBelow >= 0) {
            let gemBelow = this.gemAt(x, yBelow);
            if (gemBelow) {
                if (!gemBelow.sameType(center)) {
                    break;
                }
                ver.push(gemBelow);
            }
            yBelow--;
        }
        while (yAbove < 8) {
            let gemAbove = this.gemAt(x, yAbove);
            if (gemAbove) {
                if (!gemAbove.sameType(center)) {
                    break;
                }
                ver.push(gemAbove);
            }
            yAbove++;
        }
        if (ver.length >= 3) ver.forEach(gem => res.add(gem));

        return res;
    }

    // Find Gem at Position (x, y)
    gemAt(x, y) {
        return this.gems.find(g => g.x === x && g.y === y)
    }

    performSwap(index1, index2) {
        const currentGem = this.gems[index1];
        const swapGem = this.gems[index2];
        console.log(currentGem, swapGem);
        this.swap(currentGem, swapGem);
        const allMatchGems = this.getAllMatches();
        const distinction = new GridDistinction();
        const result = this.performDistinction(allMatchGems, distinction);
        return result;
    }

    getAllMatches() {
        const matches = [];
        for (const gem of this.gems) {
            const matchGems = this.matchesAt(parseInt(gem.x), parseInt(gem.y));
            if (matchGems.size > 0) {
                matches.push(matchGems);
            }
        }
        return matches.length > 0 ? matches : [];
    }

    performDistinction(allMatchGems, distinction) {
        for (const matchGems of allMatchGems) {
            this.distinctGemBatch(matchGems, distinction)
        }
        this.performReshape();
        const nextMatches = this.getAllMatches();
        if (nextMatches.length > 0) {
            this.performDistinction(nextMatches, distinction);
        }
        return distinction;
    }

    performGemEffect(gem, distinction) {
        switch (gem.modifier) {
            case GemModifier.EXPLODE_HORIZONTAL: {
                this.performExplodeHorizontal(gem, distinction);
            }
            case GemModifier.EXPLODE_VERTICAL: {
                this.performExplodeVertical(gem, distinction);
            }
            case GemModifier.EXPLODE_SQUARE: {
                this.performExplodeSquare(gem, distinction);
            }
        }
    }

    performExplodeHorizontal(gem, distinction) {
        for (let x = 0; x < 8; x++) {
            const targetGem = this.gemAt(x, gem.y);
            if (!targetGem.sameOne(gem)) {
                this.distinctGem(targetGem, distinction);
            }
        }
    }

    performExplodeVertical(gem, distinction) {
        for (let y = 0; y < 8; y++) {
            const targetGem = this.gemAt(gem.x, y);
            if (!targetGem.sameOne(gem)) {
                this.distinctGem(targetGem, distinction);
            }
        }
    }

    performExplodeSquare(gem, distinction) {
        for (let x = gem.x - 1; x < gem.x + 1; x++) {
            for (let y = gem.y - 1; y < gem.y + 1; y++) {
                const targetGem = this.gemAt(gem.x, y);
                if (!targetGem.sameOne(gem)) {
                    this.distinctGem(targetGem, distinction);
                }
            }
        }
    }

    distinctGemBatch(gems, distinction) {
        distinction.matchesSize.push(gems.size);
        for (const gem of gems) {
            this.distinctGem(gem, distinction);
        }

    }

    maxLinearMatch(gems) {
        const matchesX = {};
        const matchesY = {};

        for (const gem of gems) {
            matchesX[gem.x] = matchesX[gem.x] ? 1 : matchesX[gem.x] + 1;
            matchesY[gem.y] = matchesY[gem.y] ? 1 : matchesY[gem.y] + 1;
        }

        const maxX = Math.max(...Object.values(matchesX));
        const maxY = Math.max(...Object.values(matchesY));
        return Math.max(maxX, maxY);

    }

    distinctGem(gem, distinction) {
        if (gem.removed || gem.locked) {
            return;
        }
        gem.removed = true;
        this.performGemEffect(gem, distinction);
        distinction.removedGems.push(gem.clone());
    }

    performReshape() {
        for (const gem of this.gems) {
            if (gem.removed) {
                const aboveGem = this.gemAt(gem.x, gem.y + 1);
                if (!aboveGem) {
                    gem.removed = false;
                    gem.locked = true;
                    gem.type = -1;
                } else {
                    gem.type = aboveGem.type;
                    gem.locked = aboveGem.locked;
                    gem.removed = aboveGem.removed;
                    aboveGem.removed = true;
                    aboveGem.type = -1;
                }
            }
        }

        const toRemove = this.gems.find(gem => gem.removed);
        if (toRemove) {
            this.performReshape();
        }
        return false;
    }

    clone() {
        const cloned = new Grid({ size: () => 0 }, new Set());
        cloned.gems = this.gems.map(gem => gem.clone());
        cloned.gemTypes = new Set(Array.from(this.gemTypes));
        cloned.myHeroGemType = new Set(Array.from(this.myHeroGemType));
        return cloned;
    }
}