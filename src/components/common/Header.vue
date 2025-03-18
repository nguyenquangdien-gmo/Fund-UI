<template>
    <div class="card">
        <Menubar :model="items">
            <template #end>

                <div class="flex items-center gap-2 info-box">
                    <p class="font-semibold">{{ user.fullName || "Guest" }}</p>

                    <Avatar image="https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png" shape="circle" />
                </div>
            </template>
        </Menubar>
    </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import Menubar from 'primevue/menubar';
import Avatar from 'primevue/avatar';

const user = ref(JSON.parse(sessionStorage.getItem('user') || '{}'));
console.log(user.value);


const items = ref([
    {
        label: 'Home',
        icon: 'pi pi-home'
    },
    {
        label: 'Features',
        icon: 'pi pi-star'
    },
    {
        label: 'Projects',
        icon: 'pi pi-search',
        items: [
            {
                label: 'Components',
                icon: 'pi pi-bolt'
            },
            {
                label: 'Blocks',
                icon: 'pi pi-server'
            },
            {
                label: 'UI Kit',
                icon: 'pi pi-pencil'
            },
            {
                label: 'Templates',
                icon: 'pi pi-palette',
                items: [
                    {
                        label: 'Apollo',
                        icon: 'pi pi-palette'
                    },
                    {
                        label: 'Ultima',
                        icon: 'pi pi-palette'
                    }
                ]
            }
        ]
    },
    {
        label: 'Contact',
        icon: 'pi pi-envelope'
    }
]);
</script>
<style>
.info-box {
    display: flex;
}
</style>
