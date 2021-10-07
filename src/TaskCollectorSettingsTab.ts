import { App, moment, PluginSettingTab, Setting } from 'obsidian';
import { TaskCollectorSettings, DEFAULT_SETTINGS } from './TaskCollectorSettings';
import { TaskCollector } from './TaskCollector';
import TaskCollectorPlugin from "./main";


export class TaskCollectorSettingsTab extends PluginSettingTab {
    plugin: TaskCollectorPlugin;
    taskCollector: TaskCollector;

    constructor(app: App, plugin: TaskCollectorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Completing tasks" });

        const tempSettings: TaskCollectorSettings = Object.assign(this.taskCollector.settings);
        console.log("Displaying task collector settings: %o ==> %o", this.taskCollector.settings, tempSettings);

        new Setting(containerEl)
            .setName("Support canceled tasks")
            .setDesc("Use a - to indicate a canceled tasks. Canceled tasks are processed in the same way as completed tasks using options below.")
            .addToggle(toggle => toggle
                .setValue(tempSettings.supportCanceledTasks)
                .onChange(async value => {
                    tempSettings.supportCanceledTasks = value;
                    this.taskCollector.updateSettings(tempSettings);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Append date to completed task")
            .setDesc("If non-empty, append today's date in the given moment.js string format to the end of the task text.")
            .addMomentFormat((momentFormat) => momentFormat
                .setPlaceholder("YYYY-MM-DD")
                .setValue(tempSettings.appendDateFormat)
                .onChange(async (value) => {
                    try {
                        // Try formatting "now" with the specified format string
                        moment().format(value);
                        tempSettings.appendDateFormat = value;
                        this.taskCollector.updateSettings(tempSettings);
                        await this.plugin.saveSettings();
                    } catch (e) {
                        console.log(`Error parsing specified date format: ${value}`);
                    }
                })
            );

        new Setting(containerEl)
            .setName("Remove text in completed task")
            .setDesc("Text matching this regular expression should be removed from the task text. Be careful! Test your expression separately. The global flag, 'g' is used for a per-line match.")
            .addText((text) => text
                .setPlaceholder(" #(todo|task)")
                .setValue(tempSettings.removeExpression)
                .onChange(async (value) => {
                    try {
                        // try compiling the regular expression
                        this.taskCollector.tryCreateRemoveRegex(value);

                        tempSettings.removeExpression = value;
                        this.taskCollector.updateSettings(tempSettings);
                        await this.plugin.saveSettings();
                    } catch (e) {
                        console.log(`Error parsing regular expression for text replacement: ${value}`);
                    }
                })
            );

        new Setting(containerEl)
            .setName("Incomplete task indicators")
            .setDesc("Specify the set of single characters (usually a space) that mark incomplete tasks.")
            .addText((text) => text
                .setPlaceholder("> !?")
                .setValue(tempSettings.incompleteTaskValues)
                .onChange(async (value) => {
                    tempSettings.incompleteTaskValues = value;
                    if ( value.contains('x')) {
                        console.log(`Set of characters should not contain the marker for completed tasks: ${value}`);
                    } else if ( tempSettings.supportCanceledTasks && value.contains('-')) {
                        console.log(`Set of characters should not contain the marker for canceled tasks: ${value}`);
                    } else {
                        this.taskCollector.updateSettings(tempSettings);
                        await this.plugin.saveSettings();
                    }
                })
            );

        containerEl.createEl("h2", { text: "Moving completed tasks" });

        new Setting(containerEl)
            .setName("Completed area header")
            .setDesc(`Completed (or canceled) items will be inserted under the specified header (most recent at the top). When scanning the document for completed/canceled tasks, the contents from this configured header to the next heading or separator (---) will be ignored. This heading will be created if the command is invoked and the heading does not exist. The default heading is '${DEFAULT_SETTINGS.completedAreaHeader}'.`)
            .addText((text) => text
                .setPlaceholder("## Log")
                .setValue(tempSettings.completedAreaHeader)
                .onChange(async (value) => {
                    tempSettings.completedAreaHeader = value.trim();
                    this.taskCollector.updateSettings(tempSettings);
                    await this.plugin.saveSettings();
                })
            );

        containerEl.createEl("h2", { text: "Right-click Menu items" });

        new Setting(containerEl)
            .setName("Add menu item for completing a task")
            .setDesc("  Add an item to the right-click menu in edit mode to mark the task on the current line complete. If canceled items are supported, an additional menu item will be added to cancel the task on the current line.")
            .addToggle(toggle => toggle
                .setValue(tempSettings.rightClickComplete)
                .onChange(async value => {
                    tempSettings.rightClickComplete = value;
                    this.taskCollector.updateSettings(tempSettings);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName("Add menu item for moving all completed tasks")
            .setDesc("Add an item to the right-click menu in edit mode to move all completed (or canceled) tasks.")
            .addToggle(toggle => toggle
                .setValue(tempSettings.rightClickMove)
                .onChange(async value => {
                    tempSettings.rightClickMove = value;
                    this.taskCollector.updateSettings(tempSettings);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
                .setName("Add menu items for marking or clearing all tasks")
                .setDesc("Add two additional items to the right click menu: one to mark all incomplete items complete, and another to mark all items as incomplete. This bulk toggle will ignore items in the completed area.")
                .addToggle(toggle => toggle
                    .setValue(tempSettings.rightClickToggleAll)
                    .onChange(async value => {
                        tempSettings.rightClickToggleAll = value;
                        this.taskCollector.updateSettings(tempSettings);
                        await this.plugin.saveSettings();
                    }));
    }
}
