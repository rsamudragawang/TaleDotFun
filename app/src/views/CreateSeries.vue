<template>

    <Stepper :value="step">
        <div
            class="home-view h-[300px] bg-gradient-to-b from-[#6435E9] to-[#381E83] rounded-lg flex flex-col justify-center px-[40px]">
            <h1 class="text-white text-3xl font-bold text-center">Start Publishing<br> Your Series</h1>
            <StepList class="!mt-[30px]">
                <Step :value="1">Set Your Series</Step>
                <Step :value="2">Upload Your First Chapter</Step>
            </StepList>

        </div>
    </Stepper>
</template>

<script setup>
import Stepper from 'primevue/stepper';
import StepList from 'primevue/stepList';
import Step from 'primevue/step';
import { ref } from 'vue';

const step = ref(1);

</script>
