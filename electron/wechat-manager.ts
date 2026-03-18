import { exec } from 'child_process';
import sudo from 'sudo-prompt';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

interface WeChatInstance {
    name: string;
    path: string;
    isOriginal: boolean;
    bundleId?: string;
    version?: string;
}

export class WeChatManager {
    private static WECHAT_PATH = '/Applications/WeChat.app';
    private static APP_DIR = '/Applications';
    private static APP_NAME = 'WeChatMultiManager';
    private static LSREGISTER = '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';

    // Sudo exec wrapper
    private static async sudoExec(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            sudo.exec(command, { name: this.APP_NAME }, (error, stdout) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout ? stdout.toString() : '');
                }
            });
        });
    }

    // Check if official WeChat is installed
    static checkInstallation(): boolean {
        return fs.existsSync(this.WECHAT_PATH);
    }

    // Scan for all WeChat instances
    static async scanInstances(): Promise<WeChatInstance[]> {
        const instances: WeChatInstance[] = [];

        // Add original if exists
        if (this.checkInstallation()) {
            try {
                const plistPath = path.join(this.WECHAT_PATH, 'Contents', 'Info.plist');
                const { stdout } = await execAsync(`/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "${plistPath}"`);
                const version = stdout.trim();

                instances.push({
                    name: 'Original WeChat',
                    path: this.WECHAT_PATH,
                    isOriginal: true,
                    version
                });
            } catch (e) {
                // Fallback if version read fails
                instances.push({
                    name: 'Original WeChat',
                    path: this.WECHAT_PATH,
                    isOriginal: true
                });
            }
        }

        try {
            // Find all .app in /Applications
            const files = await fs.promises.readdir(this.APP_DIR);
            const appFiles = files.filter(f => f.endsWith('.app') && f !== 'WeChat.app');

            for (const file of appFiles) {
                const fullPath = path.join(this.APP_DIR, file);
                try {
                    const plistPath = path.join(fullPath, 'Contents', 'Info.plist');
                    if (fs.existsSync(plistPath)) {
                        // Get Bundle ID
                        const { stdout: idOut } = await execAsync(`/usr/libexec/PlistBuddy -c "Print :CFBundleIdentifier" "${plistPath}"`);
                        const bundleId = idOut.trim();

                        // Get Version
                        let version: string | undefined;
                        try {
                            const { stdout: verOut } = await execAsync(`/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "${plistPath}"`);
                            version = verOut.trim();
                        } catch (e) { /* ignore */ }

                        if (bundleId.includes('tencent.xinWeChat') || bundleId.includes('maclub.wechat')) {
                            instances.push({
                                name: file.replace('.app', ''),
                                path: fullPath,
                                isOriginal: false,
                                bundleId,
                                version
                            });
                        }
                    }
                } catch (e) {
                    // Ignore errors
                }
            }
        } catch (e) {
            console.error('Scan error:', e);
        }

        return instances;
    }

    // Reconstruct/Update All Instances
    static async reconstructAll(): Promise<void> {
        const instances = await this.scanInstances();
        const original = instances.find(i => i.isOriginal);

        if (!original || !original.version) {
            throw new Error('Cannot optimize update: Original WeChat version unidentified.');
        }

        // Target all instances (allow forced rebuild even if version matches)
        const targets = instances.filter(i => !i.isOriginal);

        if (targets.length === 0) return;

        const cmds: string[] = [];

        for (const inst of targets) {
            const destPath = inst.path;
            const name = inst.name;
            // Try to preserve ID, or generate new if missing
            const bundleId = inst.bundleId || `com.tencent.xinWeChat.dual.${Date.now()}.rebuilt`;

            // 1. Remove existing
            cmds.push(`rm -rf "${destPath}"`);

            // 2. Copy New Official Version
            cmds.push(`ditto "${this.WECHAT_PATH}" "${destPath}"`);

            // 3. Restore Config (ID, Name)
            cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier ${bundleId}" "${destPath}/Contents/Info.plist"`);
            cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName ${name}" "${destPath}/Contents/Info.plist"`);
            cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleName ${name}" "${destPath}/Contents/Info.plist"`);

            // 4. Cleanup & Regsign
            cmds.push(`rm -rf "${destPath}/Contents/_CodeSignature"`);
            cmds.push(`rm -f "${destPath}/Contents/Resources/"*.lproj/InfoPlist.strings`); // Fix localization override

            cmds.push(`xattr -dr com.apple.quarantine "${destPath}" || true`);
            cmds.push(`codesign --force --deep --sign - --timestamp=none "${destPath}"`);

            // 5. Refresh Cache
            cmds.push(`touch "${destPath}"`);
            cmds.push(`${this.LSREGISTER} -f "${destPath}" || true`);
        }

        cmds.push(`killall Dock || true`);

        await this.sudoExec(cmds.join(' && '));
    }

    // Create instances
    static async createInstances(baseName: string, count: number): Promise<void> {
        const cmds: string[] = [];

        for (let i = 1; i <= count; i++) {
            const name = count === 1 ? baseName : `${baseName} ${i}`;
            const destPath = path.join(this.APP_DIR, `${name}.app`);
            const newBundleId = `com.tencent.xinWeChat.dual.${Date.now()}.${i}`;

            // 1. Remove existing if any
            cmds.push(`rm -rf "${destPath}"`);
            // 2. Copy
            cmds.push(`ditto "${this.WECHAT_PATH}" "${destPath}"`);
            // 3. Modify Plist
            cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier ${newBundleId}" "${destPath}/Contents/Info.plist"`);
            cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName ${name}" "${destPath}/Contents/Info.plist"`);
            cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleName ${name}" "${destPath}/Contents/Info.plist"`);
            // 4. Resign with Entitlements (Crucial for avoiding security alerts)
            // STRATEGY CHANGE: 
            // We changed Info.plist, invalidating the main bundle signature.
            // We should only resign the top level, NOT recursively (--deep), to preserve inner framework signatures.
            // WeChat checks inner frameworks validity.

            cmds.push(`rm -rf "${destPath}/Contents/_CodeSignature"`);
            // Remove localized name overrides
            cmds.push(`rm -f "${destPath}/Contents/Resources/"*.lproj/InfoPlist.strings`);

            cmds.push(`xattr -dr com.apple.quarantine "${destPath}" || true`);

            cmds.push(`codesign --force --sign - --timestamp=none "${destPath}"`);

            // 5. Force Refresh
            cmds.push(`touch "${destPath}"`);
            cmds.push(`${this.LSREGISTER} -f "${destPath}" || true`);
            cmds.push(`killall Dock || true`);
        }

        // Join all commands
        const fullCommand = cmds.join(' && ');
        await this.sudoExec(fullCommand);
    }

    // Launch instance
    static async launchInstance(appPath: string): Promise<void> {
        await execAsync(`open -n "${appPath}"`);
    }

    // Delete instance
    static async deleteInstance(appPath: string): Promise<void> {
        if (appPath === this.WECHAT_PATH) {
            throw new Error('Cannot delete original WeChat');
        }
        await this.sudoExec(`rm -rf "${appPath}"`);
    }

    // Check running instances
    static async getRunningInstances(): Promise<string[]> {
        try {
            // Get command lines of all running processes
            const { stdout } = await execAsync('/bin/ps -A -o comm');
            const lines = stdout.split('\n');
            const runningPaths: string[] = [];

            for (const line of lines) {
                // Look for .../Contents/MacOS/WeChat
                if (line.includes('/Contents/MacOS/WeChat')) {
                    // Convert binary path to app bundle path
                    // /Applications/WeChat.app/Contents/MacOS/WeChat -> /Applications/WeChat.app
                    const appPath = line.substring(0, line.indexOf('/Contents/MacOS/WeChat'));
                    if (appPath) {
                        runningPaths.push(appPath);
                    }
                }
            }
            return runningPaths;
        } catch (e) {
            console.error('Failed to get running processes:', e);
            return [];
        }
    }

    // Stop specific instance
    static async stopInstance(appPath: string): Promise<void> {
        try {
            const execPath = path.join(appPath, 'Contents', 'MacOS', 'WeChat');
            await execAsync(`pkill -f "${execPath}"`);
        } catch (e) {
            // Process might not be running
        }
    }

    // Kill all WeChat processes
    static async killAll(): Promise<void> {
        try {
            await execAsync('pkill -f WeChat');
        } catch (e) {
            // pkill returns non-zero if no process found, which is fine
        }
    }
    // Rename instance
    static async renameInstance(oldPath: string, newName: string): Promise<void> {
        if (oldPath === this.WECHAT_PATH) {
            throw new Error('Cannot rename original WeChat');
        }

        const newPath = path.join(this.APP_DIR, `${newName}.app`);

        if (fs.existsSync(newPath)) {
            throw new Error('A WeChat instance with this name already exists');
        }

        const cmds: string[] = [];

        // 1. Rename folder
        cmds.push(`mv "${oldPath}" "${newPath}"`);

        // 2. Update Display Name, Bundle Name AND Bundle ID (Critical for Dock refresh)
        const newBundleId = `com.tencent.xinWeChat.dual.${Date.now()}.renamed`;
        cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier ${newBundleId}" "${newPath}/Contents/Info.plist"`);
        cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName ${newName}" "${newPath}/Contents/Info.plist"`);
        cmds.push(`/usr/libexec/PlistBuddy -c "Set :CFBundleName ${newName}" "${newPath}/Contents/Info.plist"`);

        // 3. Resign (Crucial after modification)
        cmds.push(`rm -rf "${newPath}/Contents/_CodeSignature"`);
        // Remove localized name overrides
        cmds.push(`rm -f "${newPath}/Contents/Resources/"*.lproj/InfoPlist.strings`);

        cmds.push(`xattr -dr com.apple.quarantine "${newPath}" || true`);
        // Use simplified signing to preserve internal signatures
        cmds.push(`codesign --force --sign - --timestamp=none "${newPath}"`);

        // 4. Force refresh cache
        cmds.push(`touch "${newPath}"`);
        cmds.push(`${this.LSREGISTER} -f "${newPath}" || true`);
        cmds.push(`killall Dock || true`);

        await this.sudoExec(cmds.join(' && '));
    }
}
