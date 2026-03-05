/*
Copyright 2026 Samuli Nikkilä

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0
*/
import { Sidebar } from './sidebar.js';

(async function () {

    'use strict';

    let seen = new WeakSet();
    const sidebar = new Sidebar();
    document.body.appendChild(sidebar.sidebar);

    //console.log(sidebar.list_available_tags);

})();
